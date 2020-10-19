import Express from 'express';
import { QnASessionDataService } from 'src/data/services/qnaSessionDataService';
import { Container } from 'typedi';

export const router = Express.Router();

const qnaSessionDataService = Container.get(QnASessionDataService);

// Get session details
router.get('/:conversationId/sessions/:sessionId', async (req, res) => {
    // This logic will be improved as part of rest api TASK 1211744, this is a boilerplate code.
    res.send(
        await qnaSessionDataService.getQnASessionData(req.params['sessionId'])
    );
});
