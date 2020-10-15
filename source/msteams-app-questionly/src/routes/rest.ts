import Express from 'express';
import { getQnASessionData } from './../data/database';

export const router = Express.Router();

// Get session details
router.get('/:conversationId/sessions/:sessionId', async (req, res) => {
    // This logic will be improved as part of rest api TASK 1211744, this is a boilerplate code.
    res.send(await getQnASessionData(req.params['sessionId']));
});
