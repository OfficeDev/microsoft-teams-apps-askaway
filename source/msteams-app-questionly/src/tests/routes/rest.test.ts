import Express from 'express';
import request from 'supertest';
import { Express as ExpressType } from 'express-serve-static-core';
import { router } from 'src/routes/rest';
import { qnaSessionDataService } from 'msteams-app-questionly.data';
import { getAllQnASesssionsDataForTab } from 'src/routes/restUtils';
import { generateUniqueId } from 'adaptivecards';

let app: ExpressType;

// Test cases will be improved as part of rest api TASK 1211744, this is a boilerplate code.
describe('test /conversations/:conversationId/sessions/:sessionId api', () => {
    beforeAll(() => {
        app = Express();

        // Rest endpoints
        app.use('/api/conversations', router);
    });

    it('validates get ama session api', async () => {
        const testSessionId = 'testId';

        const testQnASession = {
            title: generateUniqueId(),
            userName: generateUniqueId(),
            activityId: generateUniqueId(),
            conversationId: generateUniqueId(),
            userAadObjId: generateUniqueId(),
            description: generateUniqueId(),
            hostUserId: generateUniqueId(),
            isActive: true,
        };

        (<any>qnaSessionDataService.getQnASessionData) = jest.fn();
        (<any>qnaSessionDataService.getQnASessionData).mockImplementationOnce(
            () => {
                return testQnASession;
            }
        );

        const result = await request(app).get(
            `/api/conversations/1/sessions/${testSessionId}`
        );

        expect(result).toBeDefined();
        expect(result.body).toEqual(testQnASession);
        expect(qnaSessionDataService.getQnASessionData).toBeCalledTimes(1);
        expect(qnaSessionDataService.getQnASessionData).toBeCalledWith(
            testSessionId
        );
    });
});

describe('test conversations/:conversationId/sessions api', () => {
    beforeAll(async () => {
        app = Express();

        // Rest endpoints
        app.use('/api/conversations', router);
        (<any>getAllQnASesssionsDataForTab) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('get all QnA sessions data', async () => {
        const sampleConversationId = '1';
        const qnaSessionDataObject1 = {
            sessionId: '1',
            title: generateUniqueId(),
            isActive: true,
            dateTimeCreated: generateUniqueId(),
            dateTimeEnded: generateUniqueId(),
            hostUser: { id: generateUniqueId(), name: generateUniqueId() },
            numberOfQuestions: 2,
            users: [
                { id: generateUniqueId(), name: generateUniqueId() },
                { id: generateUniqueId(), name: generateUniqueId() },
            ],
        };

        const qnaSessionDataObject2 = {
            sessionId: '1',
            title: generateUniqueId(),
            isActive: true,
            dateTimeCreated: generateUniqueId(),
            dateTimeEnded: generateUniqueId(),
            hostUser: { id: generateUniqueId(), name: generateUniqueId() },
            numberOfQuestions: 3,
            users: [
                { id: generateUniqueId(), name: generateUniqueId() },
                { id: generateUniqueId(), name: generateUniqueId() },
            ],
        };

        (<any>getAllQnASesssionsDataForTab).mockImplementationOnce(() => {
            return [qnaSessionDataObject1, qnaSessionDataObject2];
        });

        const result = await request(app).get(
            `/api/conversations/${sampleConversationId}/sessions`
        );

        expect(result).toBeDefined();
        const res = JSON.parse(result.text);
        expect(res).toBeDefined();
        expect(res.length).toEqual(2);
        expect(res[0]).toEqual(qnaSessionDataObject1);
        expect(res[1]).toEqual(qnaSessionDataObject2);
        expect(getAllQnASesssionsDataForTab).toBeCalledTimes(1);
        expect(getAllQnASesssionsDataForTab).toBeCalledWith(
            sampleConversationId
        );
    });

    it('get all QnA sessions data for internal server error', async () => {
        (<any>getAllQnASesssionsDataForTab).mockImplementationOnce(() => {
            throw new Error();
        });
        const sampleConversationId = '1';
        const result = await request(app).get(
            `/api/conversations/${sampleConversationId}/sessions`
        );
        expect(result.status).toBe(500);
        expect(getAllQnASesssionsDataForTab).toBeCalledTimes(1);
        expect(getAllQnASesssionsDataForTab).toBeCalledWith(
            sampleConversationId
        );
    });

    it('get all QnA sessions data for invalid conversation id ', async () => {
        const sampleInvalidConversationId = '1';
        (<any>getAllQnASesssionsDataForTab).mockImplementationOnce(() => {
            return [];
        });

        const result = await request(app).get(
            `/api/conversations/${sampleInvalidConversationId}/sessions`
        );
        expect(result.status).toBe(204);
        expect(result.noContent).toBe(true);
        expect(getAllQnASesssionsDataForTab).toBeCalledTimes(1);
        expect(getAllQnASesssionsDataForTab).toBeCalledWith(
            sampleInvalidConversationId
        );
    });
});
