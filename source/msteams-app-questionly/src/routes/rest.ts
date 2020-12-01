import Express from 'express';
import {
    IConversationDataService,
    IConversation,
    qnaSessionDataService,
    IUser,
    questionDataService,
    IQnASession_populated,
} from 'msteams-app-questionly.data';
import { verifyUserFromConversationId } from 'msteams-app-questionly.conversation.utility';
import { exceptionLogger } from 'src/util/exceptionTracking';
import {
    processQnASesssionsDataForMeetingTab,
    patchActionForQuestion,
    formResponseWhenUserIsNotPartOfConversation,
    getHostUserId,
} from 'src/routes/restUtils';
import {
    getParticipantRole,
    isPresenterOrOrganizer,
} from 'src/util/meetingsUtility';

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

    const isUserPartOfConversation: boolean = await verifyUserFromConversationId(
        conversationId,
        conversationData.serviceUrl,
        conversationData.tenantId,
        userId
    );

    if (!isUserPartOfConversation) {
        formResponseWhenUserIsNotPartOfConversation(res);
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

        const isUserPartOfConversation: boolean = await verifyUserFromConversationId(
            conversationId,
            conversationData.serviceUrl,
            conversationData.tenantId,
            userId
        );

        if (!isUserPartOfConversation) {
            formResponseWhenUserIsNotPartOfConversation(res);
            return;
        }

        const qnaSessionsData: IQnASession_populated[] = await qnaSessionDataService.getAllQnASessionData(
            conversationId
        );

        if (qnaSessionsData.length === 0) {
            res.statusCode = 204;
        } else {
            qnaSessionResponse = await processQnASesssionsDataForMeetingTab(
                qnaSessionsData
            );
        }
    } catch (err) {
        exceptionLogger(err);
        res.statusCode = 500;
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
        res.statusCode = 500;
        res.send(err.message);
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
                res.statusCode = 400;
                res.send('questionContent is missing in the request');
                return;
            }

            const user: IUser = <IUser>req.user;
            const userId = user._id;
            const conversationId: string = req.params['conversationId'];
            const conversationData: IConversation = await conversationDataService.getConversationData(
                conversationId
            );

            const isUserPartOfConversation: boolean = await verifyUserFromConversationId(
                conversationId,
                conversationData.serviceUrl,
                conversationData.tenantId,
                userId
            );

            if (!isUserPartOfConversation) {
                formResponseWhenUserIsNotPartOfConversation(res);
                return;
            }

            response = await questionDataService.createQuestion(
                req.params['sessionId'],
                user._id,
                user.userName,
                questionContent,
                req.params['conversationId']
            );
        } catch (err) {
            exceptionLogger(err);
            res.statusCode = 500;
            res.send(err.message);
            return;
        }

        res.statusCode = 201;
        res.send(response);
    }
);

// Update ama session
router.patch('/:conversationId/sessions/:sessionId', async (req, res) => {
    try {
        const action: string = req.body.action;

        if (!isDefined(action)) {
            res.statusCode = 400;
            res.send('patch action is missing in the request');
            return;
        }

        const user: IUser = <IUser>req.user;
        const sessionId: string = req.params['sessionId'];
        const conversationId: string = req.params['conversationId'];

        if (action === 'close') {
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
                await qnaSessionDataService.endQnASession(
                    sessionId,
                    conversationId
                );
            } else {
                res.statusCode = 403;
                return res.send(
                    'Only a Presenter or an Organizer can update session.'
                );
            }
        } else {
            res.statusCode = 400;
            return res.send(`action ${action} is not supported`);
        }
    } catch (err) {
        exceptionLogger(err);
        res.statusCode = 500;
        res.send(err.message);
        return;
    }

    res.statusCode = 204;
    res.send();
});

// Create a new qna session
router.post('/:conversationId/sessions', async (req, res) => {
    let user;
    if (req.user !== undefined) {
        user = req.user;
    } else {
        res.statusCode = 500;
        exceptionLogger(new Error('User details could not be found.'));
        return res.send('User details could not be found.');
    }

    if (
        !isDefined(req.body) ||
        !isDefined(req.body.title) ||
        !isDefined(req.body.description) ||
        !isDefined(req.body.scopeId) ||
        !isDefined(req.body.isChannel)
    ) {
        res.statusCode = 400;
        res.send(
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
                res.statusCode = 400;
                exceptionLogger(
                    new Error(
                        'Only a Presenter or an Organizer can create new QnA Session.'
                    )
                );
                return res.send(
                    'Only a Presenter or an Organizer can create new QnA Session.'
                );
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

        response = await qnaSessionDataService.createQnASession(
            req.body.title,
            req.body.description,
            user.userName,
            user._id,
            '',
            conversationId,
            tenantId,
            req.body.scopeId,
            hostUserId,
            req.body.isChannel
        );
    } catch (error) {
        res.statusCode = 500;
        exceptionLogger(error);
        res.send(error);
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
                res.statusCode = 400;
                res.send('patch action is missing in the request');
                return;
            } else if (!patchActionForQuestion.includes(action.trim())) {
                res.statusCode = 400;
                res.send(`action ${action} is not supported`);
                return;
            }

            const user: IUser = <IUser>req.user;
            const sessionId: string = req.params['sessionId'];
            const conversationId: string = req.params['conversationId'];
            const questionId: string = req.params['questionId'];

            const conversationData: IConversation = await conversationDataService.getConversationData(
                conversationId
            );

            let isUserPartOfConversation: boolean;

            if (action === 'upvote') {
                isUserPartOfConversation = await verifyUserFromConversationId(
                    conversationId,
                    conversationData.serviceUrl,
                    conversationData.tenantId,
                    user._id
                );

                if (!isUserPartOfConversation) {
                    formResponseWhenUserIsNotPartOfConversation(res);
                    return;
                }

                await questionDataService.upVoteQuestion(
                    conversationId,
                    sessionId,
                    questionId,
                    user._id,
                    user.userName
                );
            } else if (action === 'downvote') {
                isUserPartOfConversation = await verifyUserFromConversationId(
                    conversationId,
                    conversationData.serviceUrl,
                    conversationData.tenantId,
                    user._id
                );

                if (!isUserPartOfConversation) {
                    formResponseWhenUserIsNotPartOfConversation(res);
                    return;
                }

                await questionDataService.downVoteQuestion(
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
                    await questionDataService.markQuestionAsAnswered(
                        conversationId,
                        sessionId,
                        questionId
                    );
                } else {
                    res.statusCode = 403;
                    return res.send(
                        'Only a Presenter or an Organizer can mark question as answered.'
                    );
                }
            }
        } catch (err) {
            exceptionLogger(err);
            res.statusCode = 500;
            res.send(err.message);
            return;
        }

        res.statusCode = 204;
        res.send();
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

        const isUserPartOfConversation: boolean = await verifyUserFromConversationId(
            conversationId,
            conversationData.serviceUrl,
            conversationData.tenantId,
            userId
        );

        if (!isUserPartOfConversation) {
            formResponseWhenUserIsNotPartOfConversation(res);
            return;
        }

        const activeSessions: IQnASession_populated[] = await qnaSessionDataService.getAllActiveQnASessionData(
            conversationId
        );
        if (activeSessions.length === 0) {
            res.statusCode = 204;
        } else {
            response = await processQnASesssionsDataForMeetingTab(
                activeSessions
            );
        }
    } catch (error) {
        exceptionLogger(error);
        res.statusCode = 500;
        res.send(error);
    }
    res.send(response);
});
