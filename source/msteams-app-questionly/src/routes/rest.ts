import Express from 'express';
import { IConversationDataService, IQnASessionDataService, IUser, IQnASession_populated, IQuestionPopulatedUser } from 'msteams-app-questionly.data';
import { getTeamsUserId, ensureUserIsPartOfMeetingConversation, ensureConversationBelongsToMeetingChat, getAndEnsureRequestBodyContainsParameter } from 'src/routes/restUtils';
import { getParticipantRole } from 'src/util/meetingsUtility';
import { StatusCodes } from 'http-status-codes';
import { IController } from 'src/controller';
import { createResponseForBadRequest } from 'src/routes/responseUtility';
import { ClientDataContract } from 'src/contracts/clientDataContract';
import { IClientDataContractFormatter } from 'src/util/clientDataContractFormatter';
import { QuestionPatchAction } from 'src/enums/questionPatchAction';
import { QnaSessionPatchAction } from 'src/enums/qnaSessionPatchAction';

export const router = Express.Router();
let conversationDataService: IConversationDataService;
let qnaSessionDataService: IQnASessionDataService;
let clientDataContractFormatter: IClientDataContractFormatter;
let controller: IController;

/**
 * Initializes router module with dependencies.
 * @param _conversationDataService - Instance of conversationDataService.
 * @param _clientDataContractFormatter - Instance of ClientDataContractFormatter.
 * @param _controller - Instance of Controller.
 */
export const initializeRouter = (
    _conversationDataService: IConversationDataService,
    _qnaSessionDataService: IQnASessionDataService,
    _clientDataContractFormatter: IClientDataContractFormatter,
    _controller: IController
) => {
    conversationDataService = _conversationDataService;
    clientDataContractFormatter = _clientDataContractFormatter;
    qnaSessionDataService = _qnaSessionDataService;
    controller = _controller;
};

// Get session details
router.get('/:conversationId/sessions/:sessionId', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        const user: any = req.user;
        const userId = user._id;
        const conversationId = req.params['conversationId'];
        const conversationData = await conversationDataService.getConversationData(conversationId);

        await ensureUserIsPartOfMeetingConversation(conversationData, userId);

        const qnaSessionData = await qnaSessionDataService.getQnASessionData(req.params['sessionId']);

        res.send(await clientDataContractFormatter.formatQnaSessionDataAsPerClientDataContract(qnaSessionData));
    } catch (error) {
        next(error);
    }
});

// Get all sessions
router.get('/:conversationId/sessions', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        const user = <IUser>req.user;
        const userId = user._id;
        const conversationId = req.params['conversationId'];
        const conversationData = await conversationDataService.getConversationData(conversationId);

        await ensureUserIsPartOfMeetingConversation(conversationData, userId);

        const qnaSessionsData: IQnASession_populated[] = await qnaSessionDataService.getAllQnASessionData(conversationId);

        if (qnaSessionsData.length === 0) {
            res.status(StatusCodes.OK).send([]);

            return;
        } else {
            res.send(await clientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract(qnaSessionsData));

            return;
        }
    } catch (error) {
        next(error);
    }
});

// Get user information
router.get('/:conversationId/me', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        const user: any = req.user;
        const userId = user._id;

        const conversationId = req.params['conversationId'];
        const conversation = await conversationDataService.getConversationData(conversationId);

        ensureConversationBelongsToMeetingChat(conversation);

        const tenantId = conversation.tenantId;
        const serviceUrl = conversation.serviceUrl;
        // `ensureConversationBelongsToMeetingChat` makes sure meeting id is available.
        const meetingId = <string>conversation.meetingId;

        const userRole = await getParticipantRole(meetingId, userId, tenantId, serviceUrl);

        const response: ClientDataContract.User = {
            userRole: userRole,
            userName: user.userName,
            userId: user._id,
        };

        res.send(response);
    } catch (error) {
        next(error);
    }
});

// Post a question
router.post('/:conversationId/sessions/:sessionId/questions', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        const questionContent = getAndEnsureRequestBodyContainsParameter(req, 'questionContent');

        const user: IUser = <IUser>req.user;
        const userId = user._id;
        const conversationId = req.params['conversationId'];

        const conversationData = await conversationDataService.getConversationData(conversationId);

        await ensureUserIsPartOfMeetingConversation(conversationData, userId);

        const result = await controller.submitNewQuestion(req.params['sessionId'], user._id, user.userName, questionContent, conversationId, conversationData.serviceUrl, conversationData.meetingId);

        const response: ClientDataContract.Question = {
            id: result._id,
            sessionId: result.qnaSessionId,
            content: result.content,
            author: { id: user._id, name: user.userName },
            votesCount: result.voters.length,
            dateTimeCreated: result.dateTimeCreated,
            isAnswered: result.isAnswered.valueOf(),
            voterAadObjectIds: result.voters,
        };

        res.status(StatusCodes.CREATED).send(response);

        return;
    } catch (error) {
        next(error);
    }
});

// Update ama session
router.patch('/:conversationId/sessions/:sessionId', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        const action = getAndEnsureRequestBodyContainsParameter(req, 'action');

        const allowedPatchActions = Object.values(QnaSessionPatchAction).map((value) => value.toString());

        if (!allowedPatchActions.includes(action)) {
            createResponseForBadRequest(res, { message: `action ${action} is not supported` });
            return;
        }

        const user: IUser = <IUser>req.user;
        const sessionId = req.params['sessionId'];
        const conversationId = req.params['conversationId'];

        if (action === QnaSessionPatchAction.End) {
            const conversationData = await conversationDataService.getConversationData(conversationId);

            ensureConversationBelongsToMeetingChat(conversationData);

            const endedByUserId = await getTeamsUserId(user._id, conversationId, conversationData.serviceUrl);

            await controller.endQnASession({
                qnaSessionId: sessionId,
                aadObjectId: user._id,
                conversationId: conversationId,
                tenantId: conversationData.tenantId,
                serviceURL: conversationData.serviceUrl,
                // `ensureConversationBelongsToMeetingChat` makes sure meeting id is available
                meetingId: <string>conversationData.meetingId,
                userName: user.userName,
                endedByUserId: endedByUserId,
            });
        }

        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        next(error);
    }
});

// Create a new qna session
router.post('/:conversationId/sessions', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        const user = <IUser>req.user;
        const sessionTitle = getAndEnsureRequestBodyContainsParameter(req, 'title');
        const sessionDescription = getAndEnsureRequestBodyContainsParameter(req, 'description');
        const scopeId = getAndEnsureRequestBodyContainsParameter(req, 'scopeId');
        // Rest APIs will be triggered from meeting group chat only
        const isChannel = false;

        const conversationId = req.params['conversationId'];
        const conversationData = await conversationDataService.getConversationData(conversationId);

        ensureConversationBelongsToMeetingChat(conversationData);

        const serviceUrl = conversationData.serviceUrl;
        const tenantId = conversationData.tenantId;
        const meetingId = conversationData.meetingId;

        const hostUserId = await getTeamsUserId(user._id, conversationId, serviceUrl);

        const session = await controller.startQnASession({
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

        const response: ClientDataContract.QnaSession = {
            sessionId: session._id,
            title: session.title,
            description: session.description,
            isActive: session.isActive,
            hostUser: { id: user._id, name: user.userName },
            dateTimeCreated: session.dateTimeCreated,
            answeredQuestions: [],
            unansweredQuestions: [],
        };

        res.send(response);
    } catch (error) {
        next(error);
    }
});

// Update question
router.patch('/:conversationId/sessions/:sessionId/questions/:questionId', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        const action = getAndEnsureRequestBodyContainsParameter(req, 'action');

        const allowedPatchActions = Object.values(QuestionPatchAction).map((value) => value.toString());

        if (!allowedPatchActions.includes(action)) {
            createResponseForBadRequest(res, { message: `action ${action} is not supported` });
            return;
        }

        const user: IUser = <IUser>req.user;
        const sessionId = req.params['sessionId'];
        const conversationId = req.params['conversationId'];
        const questionId = req.params['questionId'];

        const conversationData = await conversationDataService.getConversationData(conversationId);

        let question: IQuestionPopulatedUser;

        if (action === QuestionPatchAction.Upvote) {
            await ensureUserIsPartOfMeetingConversation(conversationData, user._id);

            question = await controller.upvoteQuestion(conversationId, sessionId, questionId, user._id, user.userName, conversationData.serviceUrl, conversationData.meetingId);

            res.status(StatusCodes.OK).send(clientDataContractFormatter.formatQuestionDataAsPerClientDataContract(question));
        } else if (action === QuestionPatchAction.Downvote) {
            await ensureUserIsPartOfMeetingConversation(conversationData, user._id);
            question = await controller.downvoteQuestion(conversationId, sessionId, questionId, user._id, user.userName, conversationData.serviceUrl, conversationData.meetingId);

            res.status(StatusCodes.OK).send(clientDataContractFormatter.formatQuestionDataAsPerClientDataContract(question));
        } else if (action === QuestionPatchAction.MarkAnswered) {
            ensureConversationBelongsToMeetingChat(conversationData);

            question = await controller.markQuestionAsAnswered(
                conversationData,
                // `ensureConversationBelongsToMeetingChat` makes sure meeting id is available
                <string>conversationData.meetingId,
                sessionId,
                questionId,
                user._id,
                conversationData.serviceUrl
            );

            res.status(StatusCodes.OK).send(clientDataContractFormatter.formatQuestionDataAsPerClientDataContract(question));
        }
    } catch (error) {
        next(error);
    }
});

// Get all active ama sessions
router.get('/:conversationId/activesessions', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        const user: any = req.user;
        const userId = user._id;
        const conversationId = req.params['conversationId'];
        const conversationData = await conversationDataService.getConversationData(conversationId);

        await ensureUserIsPartOfMeetingConversation(conversationData, userId);

        const activeSessions: IQnASession_populated[] = await qnaSessionDataService.getAllActiveQnASessionData(conversationId);
        if (activeSessions.length === 0) {
            res.status(StatusCodes.OK).send([]);
            return;
        } else {
            res.send(await clientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract(activeSessions));
            return;
        }
    } catch (error) {
        next(error);
    }
});

// Get all env variable from app setting
router.get('/:variableName', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        const varibaleName = req.params['variableName'];
        const value = process.env[varibaleName];

        if (value) {
            res.status(StatusCodes.OK).send(value);
            return;
        } else {
            res.status(StatusCodes.NOT_FOUND);
            return;
        }
    } catch (error) {
        next(error);
    }
});
