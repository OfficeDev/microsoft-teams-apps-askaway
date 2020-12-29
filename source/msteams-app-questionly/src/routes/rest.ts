import Express from 'express';
import {
    IConversationDataService,
    qnaSessionDataService,
    IUser,
    IQnASession_populated,
} from 'msteams-app-questionly.data';
import {
    processQnASesssionsDataForMeetingTab,
    patchActionForQuestion,
    getTeamsUserId,
    ensureUserIsPartOfMeetingConversation,
    ensureConversationBelongsToMeetingChat,
    getAndEnsureRequestBodyContainsParameter,
} from 'src/routes/restUtils';
import { getParticipantRole } from 'src/util/meetingsUtility';
import { StatusCodes } from 'http-status-codes';
import {
    downvoteQuestion,
    endQnASession,
    markQuestionAsAnswered,
    startQnASession,
    submitNewQuestion,
    upvoteQuestion,
} from 'src/controller';
import { createResponseForBadRequest } from 'src/routes/responseUtility';
import { qnaSessionClientDataContract } from 'src/contracts/qnaSessionClientDataContract';

export const router = Express.Router();
let conversationDataService: IConversationDataService;

export const initializeRouter = (
    _conversationDataService: IConversationDataService
) => {
    conversationDataService = _conversationDataService;
};

// Get session details
router.get(
    '/:conversationId/sessions/:sessionId',
    async (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
    ) => {
        try {
            const user: any = req.user;
            const userId = user._id;
            const conversationId = req.params['conversationId'];
            const conversationData = await conversationDataService.getConversationData(
                conversationId
            );

            await ensureUserIsPartOfMeetingConversation(
                conversationData,
                userId
            );

            // This logic will be improved as part of rest api TASK 1211744, this is a boilerplate code.
            res.send(
                await qnaSessionDataService.getQnASessionData(
                    req.params['sessionId']
                )
            );
        } catch (error) {
            next(error);
        }
    }
);

// Get all sessions
router.get(
    '/:conversationId/sessions',
    async (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
    ) => {
        try {
            const user = <IUser>req.user;
            const userId = user._id;
            const conversationId = req.params['conversationId'];
            const conversationData = await conversationDataService.getConversationData(
                conversationId
            );

            await ensureUserIsPartOfMeetingConversation(
                conversationData,
                userId
            );

            const qnaSessionsData: IQnASession_populated[] = await qnaSessionDataService.getAllQnASessionData(
                conversationId
            );

            if (qnaSessionsData.length === 0) {
                res.status(StatusCodes.OK).send([]);

                return;
            } else {
                res.send(
                    await processQnASesssionsDataForMeetingTab(qnaSessionsData)
                );

                return;
            }
        } catch (error) {
            next(error);
        }
    }
);

// Get user information
router.get(
    '/:conversationId/me',
    async (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
    ) => {
        try {
            const user: any = req.user;
            const userId = user._id;

            const conversationId = req.params['conversationId'];
            const conversation = await conversationDataService.getConversationData(
                conversationId
            );

            ensureConversationBelongsToMeetingChat(conversation);

            const tenantId = conversation.tenantId;
            const serviceUrl = conversation.serviceUrl;
            // `ensureConversationBelongsToMeetingChat` makes sure meeting id is available.
            const meetingId = <string>conversation.meetingId;

            const userRole = await getParticipantRole(
                meetingId,
                userId,
                tenantId,
                serviceUrl
            );

            res.send(userRole);
        } catch (error) {
            next(error);
        }
    }
);

// Post a question
router.post(
    '/:conversationId/sessions/:sessionId/questions',
    async (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
    ) => {
        try {
            const questionContent = getAndEnsureRequestBodyContainsParameter(
                req,
                'questionContent'
            );

            const user: IUser = <IUser>req.user;
            const userId = user._id;
            const conversationId = req.params['conversationId'];

            const conversationData = await conversationDataService.getConversationData(
                conversationId
            );

            await ensureUserIsPartOfMeetingConversation(
                conversationData,
                userId
            );

            const result = await submitNewQuestion(
                req.params['sessionId'],
                user._id,
                user.userName,
                questionContent,
                conversationId
            );

            res.status(StatusCodes.CREATED).send({
                questionId: result._id,
            });

            return;
        } catch (error) {
            next(error);
        }
    }
);

// Update ama session
router.patch(
    '/:conversationId/sessions/:sessionId',
    async (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
    ) => {
        try {
            const action = getAndEnsureRequestBodyContainsParameter(
                req,
                'action'
            );

            const user: IUser = <IUser>req.user;
            const sessionId = req.params['sessionId'];
            const conversationId = req.params['conversationId'];

            if (action === 'end') {
                const conversationData = await conversationDataService.getConversationData(
                    conversationId
                );

                ensureConversationBelongsToMeetingChat(conversationData);

                const endedByUserId = await getTeamsUserId(
                    user._id,
                    conversationId,
                    conversationData.serviceUrl
                );

                await endQnASession(
                    sessionId,
                    user._id,
                    conversationId,
                    conversationData.tenantId,
                    conversationData.serviceUrl,
                    // `ensureConversationBelongsToMeetingChat` makes sure meeting id is available
                    <string>conversationData.meetingId,
                    user.userName,
                    endedByUserId
                );
            } else {
                createResponseForBadRequest(
                    res,
                    `action ${action} is not supported`
                );
                return;
            }

            res.status(StatusCodes.NO_CONTENT).send();
        } catch (error) {
            next(error);
        }
    }
);

// Create a new qna session
router.post(
    '/:conversationId/sessions',
    async (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
    ) => {
        try {
            const user = <IUser>req.user;
            const sessionTitle = getAndEnsureRequestBodyContainsParameter(
                req,
                'title'
            );
            const sessionDescription = getAndEnsureRequestBodyContainsParameter(
                req,
                'description'
            );
            const scopeId = getAndEnsureRequestBodyContainsParameter(
                req,
                'scopeId'
            );
            // Rest APIs will be triggered from meeting group chat only
            const isChannel = false;

            const conversationId = req.params['conversationId'];
            const conversationData = await conversationDataService.getConversationData(
                conversationId
            );

            ensureConversationBelongsToMeetingChat(conversationData);

            const serviceUrl = conversationData.serviceUrl;
            const tenantId = conversationData.tenantId;
            const meetingId = conversationData.meetingId;

            const hostUserId = await getTeamsUserId(
                user._id,
                conversationId,
                serviceUrl
            );

            const session = await startQnASession({
                title: sessionTitle,
                description: sessionDescription,
                userName: user.userName,
                userAadObjectId: user._id,
                activityId: '',
                conversationId: conversationId,
                tenantId: tenantId,
                scopeId: scopeId,
                hostUserId: hostUserId,
                isChannel: isChannel,
                serviceUrl: serviceUrl,
                // `ensureConversationBelongsToMeetingChat` makes sure meeting id is available
                meetingId: <string>meetingId,
            });

            const response: qnaSessionClientDataContract = {
                sessionId: session._id,
                title: session.title,
                isActive: session.isActive,
                hostUser: { id: user._id, name: user.userName },
                numberOfQuestions: 0,
                dateTimeCreated: session.dateTimeCreated,
                users: [],
                questions: [],
            };

            res.send(response);
        } catch (error) {
            next(error);
        }
    }
);

// Update question
router.patch(
    '/:conversationId/sessions/:sessionId/questions/:questionId',
    async (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
    ) => {
        try {
            const action = getAndEnsureRequestBodyContainsParameter(
                req,
                'action'
            );

            if (!patchActionForQuestion.includes(action.trim())) {
                createResponseForBadRequest(
                    res,
                    `action ${action} is not supported`
                );
                return;
            }

            const user: IUser = <IUser>req.user;
            const sessionId = req.params['sessionId'];
            const conversationId = req.params['conversationId'];
            const questionId = req.params['questionId'];

            const conversationData = await conversationDataService.getConversationData(
                conversationId
            );

            if (action === 'upvote') {
                await ensureUserIsPartOfMeetingConversation(
                    conversationData,
                    user._id
                );

                await upvoteQuestion(
                    conversationId,
                    sessionId,
                    questionId,
                    user._id,
                    user.userName
                );
            } else if (action === 'downvote') {
                await ensureUserIsPartOfMeetingConversation(
                    conversationData,
                    user._id
                );

                await downvoteQuestion(
                    conversationId,
                    sessionId,
                    questionId,
                    user._id
                );
            } else if (action === 'markAnswered') {
                ensureConversationBelongsToMeetingChat(conversationData);

                await markQuestionAsAnswered(
                    conversationData,
                    // `ensureConversationBelongsToMeetingChat` makes sure meeting id is available
                    <string>conversationData.meetingId,
                    sessionId,
                    questionId,
                    user._id
                );
            }

            res.status(StatusCodes.NO_CONTENT).send();
        } catch (error) {
            next(error);
        }
    }
);

// Get all active ama sessions
router.get(
    '/:conversationId/activesessions',
    async (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
    ) => {
        try {
            const user: any = req.user;
            const userId = user._id;
            const conversationId = req.params['conversationId'];
            const conversationData = await conversationDataService.getConversationData(
                conversationId
            );

            await ensureUserIsPartOfMeetingConversation(
                conversationData,
                userId
            );

            const activeSessions: IQnASession_populated[] = await qnaSessionDataService.getAllActiveQnASessionData(
                conversationId
            );
            if (activeSessions.length === 0) {
                res.status(StatusCodes.OK).send([]);
                return;
            } else {
                res.send(
                    await processQnASesssionsDataForMeetingTab(activeSessions)
                );
                return;
            }
        } catch (error) {
            next(error);
        }
    }
);
