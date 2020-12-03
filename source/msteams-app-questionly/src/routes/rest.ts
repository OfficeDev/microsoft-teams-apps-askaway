import Express from 'express';
import {
    IConversationDataService,
    IConversation,
    qnaSessionDataService,
    IUser,
    IQnASession_populated,
} from 'msteams-app-questionly.data';
import { exceptionLogger } from 'src/util/exceptionTracking';
import {
    processQnASesssionsDataForMeetingTab,
    patchActionForQuestion,
    getHostUserId,
    ensureUserIsPartOfConversation,
} from 'src/routes/restUtils';
import {
    getParticipantRole,
    isPresenterOrOrganizer,
} from 'src/util/meetingsUtility';
import { StatusCodes } from 'http-status-codes';
import {
    downvoteQuestion,
    endQnASession,
    markQuestionAsAnswered,
    startQnASession,
    submitNewQuestion,
    upvoteQuestion,
} from 'src/controller';

export const router = Express.Router();
let conversationDataService: IConversationDataService;

export const initializeRouter = (
    _conversationDataService: IConversationDataService
) => {
    conversationDataService = _conversationDataService;
};

const isDefined = (param: string): boolean => {
    return param !== '' && param !== undefined && param != null;
};

// Get session details
router.get('/:conversationId/sessions/:sessionId', async (req, res) => {
    const user: any = req.user;
    const userId = user._id;
    const conversationId: string = req.params['conversationId'];
    const conversationData: IConversation = await conversationDataService.getConversationData(
        conversationId
    );

    if (
        !(await ensureUserIsPartOfConversation(res, conversationData, userId))
    ) {
        return;
    }

    // This logic will be improved as part of rest api TASK 1211744, this is a boilerplate code.
    res.send(
        await qnaSessionDataService.getQnASessionData(req.params['sessionId'])
    );
});

// Get all sessions
router.get('/:conversationId/sessions', async (req, res) => {
    let qnaSessionResponse;
    try {
        const user: any = req.user;
        const userId = user._id;
        const conversationId: string = req.params['conversationId'];
        const conversationData: IConversation = await conversationDataService.getConversationData(
            conversationId
        );

        if (
            !(await ensureUserIsPartOfConversation(
                res,
                conversationData,
                userId
            ))
        ) {
            return;
        }

        const qnaSessionsData: IQnASession_populated[] = await qnaSessionDataService.getAllQnASessionData(
            conversationId
        );

        if (qnaSessionsData.length === 0) {
            res.statusCode = StatusCodes.NO_CONTENT;
        } else {
            qnaSessionResponse = await processQnASesssionsDataForMeetingTab(
                qnaSessionsData
            );
        }
    } catch (err) {
        exceptionLogger(err);
        res.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        qnaSessionResponse = err.message;
    }
    res.send(qnaSessionResponse);
});

// Get user information
router.get('/:conversationId/me', async (req, res) => {
    let userRole;
    try {
        const user: any = req.user;
        const userId = user._id;

        const conversationId: string = req.params['conversationId'];
        const conversation: IConversation = await conversationDataService.getConversationData(
            conversationId
        );
        const tenantId = conversation.tenantId;
        const serviceUrl = conversation.serviceUrl;
        const meetingId = conversation.meetingId;

        if (meetingId === undefined) {
            throw new Error(
                `meeting does not exist for provided conversation id ${conversationId}`
            );
        }

        userRole = await getParticipantRole(
            meetingId,
            userId,
            tenantId,
            serviceUrl
        );
    } catch (err) {
        exceptionLogger(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }

    res.send(userRole);
});

// Post a question
router.post(
    '/:conversationId/sessions/:sessionId/questions',
    async (req, res) => {
        let response;
        try {
            const questionContent: string = req.body.questionContent;

            if (!isDefined(questionContent)) {
                res.status(StatusCodes.BAD_REQUEST).send(
                    'questionContent is missing in the request'
                );
                return;
            }

            const user: IUser = <IUser>req.user;
            const userId = user._id;
            const conversationId: string = req.params['conversationId'];
            const conversationData: IConversation = await conversationDataService.getConversationData(
                conversationId
            );

            if (
                !(await ensureUserIsPartOfConversation(
                    res,
                    conversationData,
                    userId
                ))
            ) {
                return;
            }

            const result = await submitNewQuestion(
                req.params['sessionId'],
                user._id,
                user.userName,
                questionContent,
                conversationId
            );

            if (result.isOk()) {
                response = { questionId: result.value._id };
            } else {
                throw result.value;
            }
        } catch (err) {
            exceptionLogger(err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
            return;
        }

        res.status(StatusCodes.CREATED).send(response);
    }
);

// Update ama session
router.patch('/:conversationId/sessions/:sessionId', async (req, res) => {
    try {
        const action: string = req.body.action;

        if (!isDefined(action)) {
            res.status(StatusCodes.BAD_REQUEST).send(
                'patch action is missing in the request'
            );
            return;
        }

        const user: IUser = <IUser>req.user;
        const sessionId: string = req.params['sessionId'];
        const conversationId: string = req.params['conversationId'];

        if (action === 'end') {
            const conversationData: IConversation = await conversationDataService.getConversationData(
                conversationId
            );

            if (
                conversationData.meetingId !== undefined &&
                isPresenterOrOrganizer(
                    conversationData.meetingId,
                    user._id,
                    conversationData.tenantId,
                    conversationData.serviceUrl
                )
            ) {
                await endQnASession(
                    sessionId,
                    user._id,
                    conversationId,
                    conversationData.tenantId,
                    conversationData.serviceUrl,
                    conversationData.meetingId
                );
            } else {
                res.status(StatusCodes.FORBIDDEN).send(
                    'Only a Presenter or an Organizer can update session.'
                );
                return;
            }
        } else {
            res.status(StatusCodes.BAD_REQUEST).send(
                `action ${action} is not supported`
            );
        }
    } catch (err) {
        exceptionLogger(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
        return;
    }

    res.status(StatusCodes.NO_CONTENT).send();
});

// Create a new qna session
router.post('/:conversationId/sessions', async (req, res) => {
    let user;
    if (req.user !== undefined) {
        user = req.user;
    } else {
        exceptionLogger(new Error('User details could not be found.'));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            'User details could not be found.'
        );
        return;
    }

    if (
        !isDefined(req.body) ||
        !isDefined(req.body.title) ||
        !isDefined(req.body.description) ||
        !isDefined(req.body.scopeId) ||
        !isDefined(req.body.isChannel)
    ) {
        res.status(StatusCodes.BAD_REQUEST).send(
            `One or more parameters missing in the request payload. Check if title, description, scopeId, and isChannel are provided.`
        );
        return;
    }

    const conversationId = req.params['conversationId'];
    let response;
    try {
        const conversationData = await conversationDataService.getConversationData(
            conversationId
        );
        const serviceUrl = conversationData.serviceUrl;
        const tenantId = conversationData.tenantId;
        const meetingId = conversationData.meetingId;

        // check if the user/participant is either presenter or organizer.
        if (meetingId !== undefined) {
            const canCreateQnASession = isPresenterOrOrganizer(
                meetingId,
                user._id,
                tenantId,
                serviceUrl
            );

            if (!canCreateQnASession) {
                exceptionLogger(
                    new Error(
                        'Only a Presenter or an Organizer can create new QnA Session.'
                    )
                );
                res.status(StatusCodes.BAD_REQUEST).send(
                    'Only a Presenter or an Organizer can create new QnA Session.'
                );
                return;
            }
        } else {
            throw new Error(
                `meeting does not exist for provided conversation id ${conversationId}`
            );
        }

        const hostUserId = await getHostUserId(
            user._id,
            conversationId,
            serviceUrl
        );

        const session = await startQnASession(
            req.body.title,
            req.body.description,
            user.userName,
            user._id,
            '',
            conversationId,
            tenantId,
            req.body.scopeId,
            hostUserId,
            req.body.isChannel,
            serviceUrl,
            meetingId
        );

        response = { qnaSessionId: session._id };
    } catch (error) {
        exceptionLogger(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        return;
    }
    res.send(response);
});

// Update question
router.patch(
    '/:conversationId/sessions/:sessionId/questions/:questionId',
    async (req, res) => {
        try {
            const action: string = req.body.action;

            if (!isDefined(action)) {
                res.status(StatusCodes.BAD_REQUEST).send(
                    'patch action is missing in the request'
                );
                return;
            } else if (!patchActionForQuestion.includes(action.trim())) {
                res.status(StatusCodes.BAD_REQUEST).send(
                    `action ${action} is not supported`
                );
                return;
            }

            const user: IUser = <IUser>req.user;
            const sessionId: string = req.params['sessionId'];
            const conversationId: string = req.params['conversationId'];
            const questionId: string = req.params['questionId'];

            const conversationData: IConversation = await conversationDataService.getConversationData(
                conversationId
            );

            if (action === 'upvote') {
                if (
                    !(await ensureUserIsPartOfConversation(
                        res,
                        conversationData,
                        user._id
                    ))
                ) {
                    return;
                }

                await upvoteQuestion(
                    conversationId,
                    sessionId,
                    questionId,
                    user._id,
                    user.userName
                );
            } else if (action === 'downvote') {
                if (
                    !(await ensureUserIsPartOfConversation(
                        res,
                        conversationData,
                        user._id
                    ))
                ) {
                    return;
                }

                await downvoteQuestion(
                    conversationId,
                    sessionId,
                    questionId,
                    user._id
                );
            } else if (action === 'markAnswered') {
                if (
                    conversationData.meetingId !== undefined &&
                    isPresenterOrOrganizer(
                        conversationData.meetingId,
                        user._id,
                        conversationData.tenantId,
                        conversationData.serviceUrl
                    )
                ) {
                    await markQuestionAsAnswered(
                        conversationId,
                        sessionId,
                        questionId,
                        user._id
                    );
                } else {
                    res.status(StatusCodes.FORBIDDEN).send(
                        'Only a Presenter or an Organizer can mark question as answered.'
                    );
                }
            }
        } catch (err) {
            exceptionLogger(err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
            return;
        }

        res.status(StatusCodes.NO_CONTENT).send();
    }
);

// Get all active ama sessions
router.get('/:conversationId/activesessions', async (req, res) => {
    let response;
    try {
        const user: any = req.user;
        const userId = user._id;
        const conversationId: string = req.params['conversationId'];
        const conversationData: IConversation = await conversationDataService.getConversationData(
            conversationId
        );

        if (
            !(await ensureUserIsPartOfConversation(
                res,
                conversationData,
                userId
            ))
        ) {
            return;
        }

        const activeSessions: IQnASession_populated[] = await qnaSessionDataService.getAllActiveQnASessionData(
            conversationId
        );
        if (activeSessions.length === 0) {
            res.statusCode = StatusCodes.NO_CONTENT;
        } else {
            response = await processQnASesssionsDataForMeetingTab(
                activeSessions
            );
        }
    } catch (error) {
        exceptionLogger(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        return;
    }
    res.send(response);
});
