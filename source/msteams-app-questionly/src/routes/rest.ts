import Express from 'express';
import { qnaSessionDataService } from 'msteams-app-questionly.data';
import { exceptionLogger } from 'src/util/exceptionTracking';
import {
    getAllQnASesssionsDataForTab,
    getNumberOfActiveSessions,
    isPresenterOrOrganizer,
} from 'src/routes/restUtils';
import bodyParser from 'body-parser';

export const router = Express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

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
    let tenantId;
    if (process.env.TenantId !== undefined) {
        tenantId = process.env.TenantId;
    } else {
        res.statusCode = 500;
        exceptionLogger(new Error('Tenant id is missing in the settings.'));
        return res.send('Tenant id is missing in the settings.');
    }
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

    // hard coded for now. once the Conversation document changes are merged, fetch service url from there.
    const serviceUrl = 'https://smba.trafficmanager.net/amer';

    // check if the user/participant is either presenter or organizer.
    if (meetingId !== undefined) {
        try {
            if (
                !isPresenterOrOrganizer(
                    meetingId,
                    user._id,
                    tenantId,
                    serviceUrl
                )
            ) {
                res.statusCode = 400;
                exceptionLogger(
                    new Error(
                        'Either a Presenter or an Organizer can only create new QnA Session.'
                    )
                );
                return res.send(
                    'Either a Presenter or an Organizer can only create new QnA Session.'
                );
            }
        } catch (error) {
            res.statusCode = 500;
            exceptionLogger(error);
            return res.send(error.message);
        }
    }

    // get all ama sessions and check if number of active sessions is less than 1.
    const numberOfActiveSessions = await getNumberOfActiveSessions(
        conversationId
    );
    if (numberOfActiveSessions > 1) {
        res.statusCode = 500;
        exceptionLogger(
            new Error(
                `Could not create a new QnA session. There are ${numberOfActiveSessions} active sessions already.`
            )
        );
        return res.send(
            `Could not create a new QnA session. There are ${numberOfActiveSessions} active sessions already.`
        );
    }

    const response = await qnaSessionDataService.createQnASession(
        req.body.title,
        req.body.description,
        user.userName,
        user._id,
        req.body.activityId,
        conversationId,
        tenantId,
        req.body.scopeId,
        req.body.hostUserId,
        req.body.isChannel
    );
    res.send(response.qnaSessionId);
});
