import Express from 'express';
import request from 'supertest';
import { Express as ExpressType } from 'express-serve-static-core';
import { router, initializeRouter } from 'src/routes/rest';
import {
    ConversationDataService,
    qnaSessionDataService,
    questionDataService,
} from 'msteams-app-questionly.data';
import {
    getAllQnASesssionsDataForTab,
    getParticipantRole,
    isPresenterOrOrganizer,
} from 'src/routes/restUtils';
import { generateUniqueId } from 'adaptivecards';

let app: ExpressType;

const testUserId = 'testUserId';
const testUserName = 'testUserName';
const conversationDataService = new ConversationDataService();
const sampleConversationId = 'sampleConversationId';
const samplTtitle = 'sample title';
const sampleDescription = 'sample description';
const sampleScopeId = 'scoopeId';
const sampleHostUserId = 'sampleHostId';
const sampleMeetingId = 'sampleMeetingId';
const sampleUserId = 'sampleUserID';
const sampleUserName = 'sampleUserName';
const sampleQnASessionId = 'sampleQnASessionId';
const sampleServiceUrl = 'sampleServiceUrl';
const sampleTenantId = 'sampleTenantId';

// Test cases will be improved as part of rest api TASK 1211744, this is a boilerplate code.
describe('test /conversations/:conversationId/sessions/:sessionId api', () => {
    beforeAll(() => {
        app = Express();

        initializeRouter(conversationDataService);

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

        initializeRouter(conversationDataService);

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

describe('test post conversations/:conversationId/sessions api', () => {
    beforeAll(async () => {
        app = Express();
        app.use(
            Express.json({
                verify: (req, res, buf: Buffer): void => {
                    (<any>req).rawBody = buf.toString();
                },
            })
        );
        app.use(Express.urlencoded({ extended: true }));

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: sampleUserId,
                userName: sampleUserName,
            };
            next();
        };
        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);

        initializeRouter(conversationDataService);

        (<any>isPresenterOrOrganizer) = jest.fn();
        (<any>qnaSessionDataService.createQnASession) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test post a qna session', async () => {
        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return {
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });
        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return true;
        });
        (<any>qnaSessionDataService.createQnASession).mockImplementationOnce(
            () => {
                return {
                    qnaSessionId: sampleQnASessionId,
                    hostId: sampleHostUserId,
                };
            }
        );

        const result = await request(app)
            .post(`/api/conversations/${sampleConversationId}/sessions`)
            .send({
                title: samplTtitle,
                description: sampleDescription,
                scopeId: sampleScopeId,
                hostUserId: sampleHostUserId,
                isChannel: true,
            });
        expect(result).toBeDefined();
        expect(result.status).toBe(200);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(qnaSessionDataService.createQnASession).toBeCalledTimes(1);
    });

    it('test post a qna session - createQnASession fails', async () => {
        const testError = new Error();
        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return {
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });
        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return true;
        });
        (<any>qnaSessionDataService.createQnASession).mockImplementationOnce(
            () => {
                throw testError;
            }
        );

        const result = await request(app)
            .post(`/api/conversations/${sampleConversationId}/sessions`)
            .send({
                title: samplTtitle,
                description: sampleDescription,
                scopeId: sampleScopeId,
                hostUserId: sampleHostUserId,
                isChannel: true,
            });
        expect(result.status).toBe(500);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(qnaSessionDataService.createQnASession).toBeCalledTimes(1);
    });

    it('test post a qna session - isPresenterOrOrganizer returns false', async () => {
        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return {
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });
        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return false;
        });

        const result = await request(app)
            .post(`/api/conversations/${sampleConversationId}/sessions`)
            .send({
                title: samplTtitle,
                description: sampleDescription,
                scopeId: sampleScopeId,
                hostUserId: sampleHostUserId,
                isChannel: true,
            });
        expect(result.status).toBe(400);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(qnaSessionDataService.createQnASession).toBeCalledTimes(0);
    });

    it('test post a qna session - getConversationData fails', async () => {
        const testError = new Error();
        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app)
            .post(`/api/conversations/${sampleConversationId}/sessions`)
            .send({
                title: samplTtitle,
                description: sampleDescription,
                scopeId: sampleScopeId,
                hostUserId: sampleHostUserId,
                isChannel: true,
            });
        expect(result.status).toBe(500);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledTimes(0);
        expect(qnaSessionDataService.createQnASession).toBeCalledTimes(0);
    });
});

describe('test /conversations/:conversationId/sessions/:sessionId/questions api', () => {
    beforeAll(() => {
        app = Express();

        app.use(
            Express.json({
                verify: (req, res, buf: Buffer): void => {
                    (<any>req).rawBody = buf.toString();
                },
            })
        );

        app.use(Express.urlencoded({ extended: true }));

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: testUserId,
                userName: testUserName,
            };
            next();
        };

        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
    });

    it('questionContent missing in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';

        const result = await request(app).post(
            `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`
        );

        expect(result.status).toBe(400);
        expect(result.text).toEqual(
            'questionContent is missing in the request'
        );
    });

    it('questionContent as null in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';

        const result = await request(app)
            .post(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`
            )
            .send({ questionContent: null });

        expect(result.status).toBe(400);
        expect(result.text).toEqual(
            'questionContent is missing in the request'
        );
    });

    it('questionContent as empty string in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';

        const result = await request(app)
            .post(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`
            )
            .send({ questionContent: '' });

        expect(result.status).toBe(400);
        expect(result.text).toEqual(
            'questionContent is missing in the request'
        );
    });

    it('createQuestion throws error', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testError: Error = new Error('test error');
        const testQuestionContent = 'testQuestionContent';

        (<any>questionDataService.createQuestion) = jest.fn();
        (<any>questionDataService.createQuestion).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app)
            .post(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`
            )
            .send({ questionContent: testQuestionContent });

        expect(result.status).toBe(500);
        expect(result.text).toEqual(testError.message);
        expect(questionDataService.createQuestion).toBeCalledTimes(1);
        expect(questionDataService.createQuestion).toBeCalledWith(
            testSessionId,
            testUserId,
            testUserName,
            testQuestionContent,
            sampleConversationId
        );
    });

    it('create question successfully', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const questionId = 'testQuestionId';
        const testQuestionContent = 'testQuestionContent';

        (<any>questionDataService.createQuestion) = jest.fn();
        (<any>questionDataService.createQuestion).mockImplementationOnce(() => {
            return questionId;
        });

        const result = await request(app)
            .post(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`
            )
            .send({ questionContent: testQuestionContent });

        expect(result.status).toBe(201);
        expect(result.text).toEqual(questionId);
        expect(questionDataService.createQuestion).toBeCalledTimes(1);
        expect(questionDataService.createQuestion).toBeCalledWith(
            testSessionId,
            testUserId,
            testUserName,
            testQuestionContent,
            sampleConversationId
        );
    });
});

describe('test /conversations/:conversationId/me api', () => {
    beforeAll(() => {
        app = Express();

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: testUserId,
            };
            next();
        };

        (<any>getParticipantRole) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();

        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('validates me api', async () => {
        const testConversation = {
            _id: 'testConvId',
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        const testRole = 'testRole';

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>getParticipantRole).mockImplementationOnce(() => {
            return testRole;
        });

        const result = await request(app).get(
            `/api/conversations/${testConversation._id}/me`
        );

        expect(result).toBeDefined();
        expect(result.text).toEqual(testRole);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(
            testConversation._id
        );
        expect(getParticipantRole).toBeCalledTimes(1);
        expect(getParticipantRole).toBeCalledWith(
            testConversation.meetingId,
            testUserId,
            testConversation.tenantId,
            testConversation.serviceUrl
        );
    });

    it('validates me api - getParticipantRole throws error', async () => {
        const testConversation = {
            _id: 'testConvId',
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        const testError = new Error('test error');

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>getParticipantRole).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).get(
            `/api/conversations/${testConversation._id}/me`
        );

        expect(result).toBeDefined();
        expect(result.text).toEqual(testError.message);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(
            testConversation._id
        );
        expect(getParticipantRole).toBeCalledTimes(1);
        expect(getParticipantRole).toBeCalledWith(
            testConversation.meetingId,
            testUserId,
            testConversation.tenantId,
            testConversation.serviceUrl
        );
    });

    it('validates me api - meeting id not associated with conversation', async () => {
        const testConversation = {
            _id: 'testConvId',
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
        };

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return testConversation;
        });

        const result = await request(app).get(
            `/api/conversations/${testConversation._id}/me`
        );

        expect(result).toBeDefined();
        expect(result.text).toEqual(
            `meeting does not exist for provided conversation id ${testConversation._id}`
        );
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(
            testConversation._id
        );
    });

    it('validates me api - getParticipantRole throws error', async () => {
        const testConversation = {
            _id: 'testConvId',
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        const testError = new Error('test error');

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).get(
            `/api/conversations/${testConversation._id}/me`
        );

        expect(result).toBeDefined();
        expect(result.text).toEqual(testError.message);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(
            testConversation._id
        );
    });
});
