import Express, { Router } from 'express';
import {
    IConversationDataService,
    qnaSessionDataService,
} from 'msteams-app-questionly.data';
import { exceptionLogger } from 'src/util/exceptionTracking';
import {
    getAllQnASesssionsDataForTab,
    isPresenterOrOrganizer,
} from 'src/routes/restUtils';

export const router = Express.Router();
let conversationDataService: IConversationDataService;

export const initializeRouter = (
    _conversationDataService: IConversationDataService
) => {
    conversationDataService = _conversationDataService;
};

// Get session details
router.get('/:conversationId/sessions/:sessionId', async (req, res) => {
    // This logic will be improved as part of rest api TASK 1211744, this is a boilerplate code.
    res.send(
        await qnaSessionDataService.getQnASessionData(req.params['sessionId'])
    );
});

// Get all sessions
router.get('/:conversationId/sessions', async (req, res) => {
    let qnaSessionResponse;
    try {
        qnaSessionResponse = await getAllQnASesssionsDataForTab(
            req.params['conversationId']
        );
        if (qnaSessionResponse.length === 0) {
            res.statusCode = 204;
        }
    } catch (err) {
        exceptionLogger(err);
        res.statusCode = 500;
        qnaSessionResponse = err.message;
    }
    res.send(qnaSessionResponse);
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

    const conversationId = req.params['conversationId'];
    const meetingId = req.body.meetingId;
    let response;

    try {
        const conversationData = await conversationDataService.getConversationData(
            conversationId
        );
        const serviceUrl = conversationData.serviceUrl;
        const tenantId = conversationData.tenantId;

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
        }

        // get all ama sessions and check if number of active sessions is less than 1.
        const numberOfActiveSessions = await qnaSessionDataService.getNumberOfActiveSessions(
            conversationId
        );
        if (numberOfActiveSessions >= 1) {
            res.statusCode = 500;
            exceptionLogger(
                new Error(
                    `Could not create a new QnA session. There are ${numberOfActiveSessions} active session(s) already.`
                )
            );
            return res.send(
                `Could not create a new QnA session. There are ${numberOfActiveSessions} active session(s) already.`
            );
        }

        response = await qnaSessionDataService.createQnASession(
            req.body.title,
            req.body.description,
            user.userName,
            user._id,
            '',
            conversationId,
            tenantId,
            req.body.scopeId,
            req.body.hostUserId,
            req.body.isChannel
        );
    } catch (error) {
        res.statusCode = 500;
        exceptionLogger(error);
        res.send(error);
    }
    res.send(response);
});
