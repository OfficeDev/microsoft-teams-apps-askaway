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
    processQnASesssionsDataForMeetingTab,
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
let testQnAData1, testQnAData2;

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
        (<any>qnaSessionDataService.getAllQnASessionData) = jest.fn();
        (<any>processQnASesssionsDataForMeetingTab) = jest.fn();

        testQnAData1 = {
            id: generateUniqueId(),
            hostId: generateUniqueId(),
            hostUserId: generateUniqueId(),
            title: generateUniqueId(),
            description: generateUniqueId(),
            conversationId: generateUniqueId(),
            tenantId: generateUniqueId(),
            isActive: true,
        };

        testQnAData2 = {
            id: generateUniqueId(),
            hostId: generateUniqueId(),
            hostUserId: generateUniqueId(),
            title: generateUniqueId(),
            description: generateUniqueId(),
            conversationId: generateUniqueId(),
            tenantId: generateUniqueId(),
            isActive: true,
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('get all QnA sessions data', async () => {
        const testQnAData = [testQnAData1, testQnAData2];
        (<any>(
            qnaSessionDataService.getAllQnASessionData
        )).mockImplementationOnce(() => {
            return testQnAData;
        });
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

        (<any>processQnASesssionsDataForMeetingTab).mockImplementationOnce(
            () => {
                return [qnaSessionDataObject1, qnaSessionDataObject2];
            }
        );

        const result = await request(app).get(
            `/api/conversations/${sampleConversationId}/sessions`
        );

        expect(result).toBeDefined();
        const res = JSON.parse(result.text);
        expect(res).toBeDefined();
        expect(res.length).toEqual(2);
        expect(res[0]).toEqual(qnaSessionDataObject1);
        expect(res[1]).toEqual(qnaSessionDataObject2);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledTimes(1);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledWith(
            testQnAData
        );
    });

    it('get all QnA sessions data for internal server error', async () => {
        const testQnAData = [testQnAData1, testQnAData2];
        (<any>(
            qnaSessionDataService.getAllQnASessionData
        )).mockImplementationOnce(() => {
            return testQnAData;
        });
        (<any>processQnASesssionsDataForMeetingTab).mockImplementationOnce(
            () => {
                throw new Error();
            }
        );
        const sampleConversationId = '1';
        const result = await request(app).get(
            `/api/conversations/${sampleConversationId}/sessions`
        );
        expect(result.status).toBe(500);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledTimes(1);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledWith(
            testQnAData
        );
    });

    it('get all QnA sessions data for invalid conversation id ', async () => {
        const sampleInvalidConversationId = '1';
        const testQnAData = [];
        (<any>(
            qnaSessionDataService.getAllQnASessionData
        )).mockImplementationOnce(() => {
            return testQnAData;
        });
        const result = await request(app).get(
            `/api/conversations/${sampleInvalidConversationId}/sessions`
        );
        expect(result.status).toBe(204);
        expect(result.noContent).toBe(true);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledTimes(0);
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

describe('test /conversations/:conversationId/sessions/:sessionId/questions/:questionId api', () => {
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

        (<any>questionDataService.upVoteQuestion) = jest.fn();
        (<any>questionDataService.downVoteQuestion) = jest.fn();
        (<any>questionDataService.markQuestionAsAnswered) = jest.fn();
        (<any>isPresenterOrOrganizer) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('patch action missing in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';

        const result = await request(app).patch(
            `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
        );

        expect(result.status).toBe(400);
        expect(result.text).toEqual('patch action is missing in the request');
    });

    it('patch action as null in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: null });

        expect(result.status).toBe(400);
        expect(result.text).toEqual('patch action is missing in the request');
    });

    it('patch action as empty string in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: '' });

        expect(result.status).toBe(400);
        expect(result.text).toEqual('patch action is missing in the request');
    });

    it('invalid patch action in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';
        const randomAction = 'randomaction';

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: randomAction });

        expect(result.status).toBe(400);
        expect(result.text).toEqual(`action ${randomAction} is not supported`);
    });

    it('upVoteQuestion api throws error for upvote action', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';
        const testError: Error = new Error('test error');

        (<any>questionDataService.upVoteQuestion).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: 'upvote' });

        expect(result.status).toBe(500);
        expect(result.text).toEqual(testError.message);
        expect(questionDataService.upVoteQuestion).toBeCalledTimes(1);
        expect(questionDataService.upVoteQuestion).toBeCalledWith(
            sampleConversationId,
            testSessionId,
            testQuestionId,
            testUserId,
            testUserName
        );
    });

    it('upVote question action', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: 'upvote' });

        expect(result.status).toBe(204);
        expect(result.noContent).toBeTruthy();
        expect(questionDataService.upVoteQuestion).toBeCalledTimes(1);
        expect(questionDataService.upVoteQuestion).toBeCalledWith(
            sampleConversationId,
            testSessionId,
            testQuestionId,
            testUserId,
            testUserName
        );
    });

    it('downVoteQuestion api throws error for downvote action', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';
        const testError: Error = new Error('test error');

        (<any>questionDataService.downVoteQuestion).mockImplementationOnce(
            () => {
                throw testError;
            }
        );

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: 'downvote' });

        expect(result.status).toBe(500);
        expect(result.text).toEqual(testError.message);
        expect(questionDataService.downVoteQuestion).toBeCalledTimes(1);
        expect(questionDataService.downVoteQuestion).toBeCalledWith(
            sampleConversationId,
            testSessionId,
            testQuestionId,
            testUserId
        );
    });

    it('downVote question action', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: 'downvote' });

        expect(result.status).toBe(204);
        expect(result.noContent).toBeTruthy();
        expect(questionDataService.downVoteQuestion).toBeCalledTimes(1);
        expect(questionDataService.downVoteQuestion).toBeCalledWith(
            sampleConversationId,
            testSessionId,
            testQuestionId,
            testUserId
        );
    });

    it('markQuestionAsAnswered api throws error for markAnswered action', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';
        const testError: Error = new Error('test error');

        (<any>(
            questionDataService.markQuestionAsAnswered
        )).mockImplementationOnce(() => {
            throw testError;
        });

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return true;
        });

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: 'markAnswered' });

        expect(result.status).toBe(500);
        expect(result.text).toEqual(testError.message);
        expect(questionDataService.markQuestionAsAnswered).toBeCalledTimes(1);
        expect(questionDataService.markQuestionAsAnswered).toBeCalledWith(
            sampleConversationId,
            testSessionId,
            testQuestionId
        );
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledWith(
            sampleMeetingId,
            testUserId,
            sampleTenantId,
            sampleServiceUrl
        );
        expect(
            <any>conversationDataService.getConversationData
        ).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(
            sampleConversationId
        );
    });

    it('markAnswered question action', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return true;
        });

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: 'markAnswered' });

        expect(result.status).toBe(204);
        expect(result.noContent).toBeTruthy();
        expect(questionDataService.markQuestionAsAnswered).toBeCalledTimes(1);
        expect(questionDataService.markQuestionAsAnswered).toBeCalledWith(
            sampleConversationId,
            testSessionId,
            testQuestionId
        );
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledWith(
            sampleMeetingId,
            testUserId,
            sampleTenantId,
            sampleServiceUrl
        );
        expect(
            <any>conversationDataService.getConversationData
        ).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(
            sampleConversationId
        );
    });

    it('markAnswered question action - user is not presenter or organizer', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testQuestionId = 'q1';

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return false;
        });

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`
            )
            .send({ action: 'markAnswered' });

        expect(result.status).toBe(403);
        expect(result.text).toEqual(
            'Only a Presenter or an Organizer can mark question as answered.'
        );
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledWith(
            sampleMeetingId,
            testUserId,
            sampleTenantId,
            sampleServiceUrl
        );
        expect(
            <any>conversationDataService.getConversationData
        ).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(
            sampleConversationId
        );
    });
});

describe('test /conversations/:conversationId/sessions/:sessionId patch api', () => {
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

        (<any>qnaSessionDataService.endQnASession) = jest.fn();
        (<any>isPresenterOrOrganizer) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();

        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('patch action is missing in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';

        const result = await request(app).patch(
            `/api/conversations/${sampleConversationId}/sessions/${testSessionId}`
        );

        expect(result.status).toBe(400);
        expect(result.text).toEqual('patch action is missing in the request');
    });

    it('patch action as null in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}`
            )
            .send({ action: null });

        expect(result.status).toBe(400);
        expect(result.text).toEqual('patch action is missing in the request');
    });

    it('patch action as empty string in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}`
            )
            .send({ action: '' });

        expect(result.status).toBe(400);
        expect(result.text).toEqual('patch action is missing in the request');
    });

    it('invalid patch action in request', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const randomAction = 'randomaction';

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}`
            )
            .send({ action: randomAction });

        expect(result.status).toBe(400);
        expect(result.text).toEqual(`action ${randomAction} is not supported`);
    });

    it('endQnASession api throws error', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testError: Error = new Error('test error');

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return true;
        });

        (<any>qnaSessionDataService.endQnASession).mockImplementationOnce(
            () => {
                throw testError;
            }
        );

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}`
            )
            .send({ action: 'close' });

        expect(result.status).toBe(500);
        expect(result.text).toEqual(testError.message);
        expect(qnaSessionDataService.endQnASession).toBeCalledTimes(1);
        expect(qnaSessionDataService.endQnASession).toBeCalledWith(
            testSessionId,
            sampleConversationId
        );
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledWith(
            sampleMeetingId,
            testUserId,
            sampleTenantId,
            sampleServiceUrl
        );
        expect(
            <any>conversationDataService.getConversationData
        ).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(
            sampleConversationId
        );
    });

    it('getConversationData api throws error', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';
        const testError: Error = new Error('test error');

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}`
            )
            .send({ action: 'close' });

        expect(result.status).toBe(500);
        expect(result.text).toEqual(testError.message);
        expect(
            <any>conversationDataService.getConversationData
        ).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(
            sampleConversationId
        );
    });

    it('user is not presenter or organizer', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return false;
        });

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}`
            )
            .send({ action: 'close' });

        expect(result.status).toBe(403);
        expect(result.text).toEqual(
            'Only a Presenter or an Organizer can update session.'
        );
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledWith(
            sampleMeetingId,
            testUserId,
            sampleTenantId,
            sampleServiceUrl
        );
        expect(
            <any>conversationDataService.getConversationData
        ).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(
            sampleConversationId
        );
    });

    it('close session action', async () => {
        const testSessionId = 'testId';
        const sampleConversationId = '1';

        (<any>(
            conversationDataService.getConversationData
        )).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return true;
        });

        const result = await request(app)
            .patch(
                `/api/conversations/${sampleConversationId}/sessions/${testSessionId}`
            )
            .send({ action: 'close' });

        expect(result.status).toBe(204);
        expect(result.noContent).toBeTruthy();
        expect(qnaSessionDataService.endQnASession).toBeCalledTimes(1);
        expect(qnaSessionDataService.endQnASession).toBeCalledWith(
            testSessionId,
            sampleConversationId
        );
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledWith(
            sampleMeetingId,
            testUserId,
            sampleTenantId,
            sampleServiceUrl
        );
        expect(
            <any>conversationDataService.getConversationData
        ).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(
            sampleConversationId
        );
    });
});

describe('test get /:conversationId/activesessions api', () => {
    beforeAll(async () => {
        app = Express();

        initializeRouter(conversationDataService);

        // Rest endpoints
        app.use('/api/conversations', router);
        (<any>qnaSessionDataService.getAllActiveQnASessionData) = jest.fn();
        (<any>processQnASesssionsDataForMeetingTab) = jest.fn();

        testQnAData1 = {
            id: generateUniqueId(),
            hostId: generateUniqueId(),
            hostUserId: generateUniqueId(),
            title: generateUniqueId(),
            description: generateUniqueId(),
            conversationId: generateUniqueId(),
            tenantId: generateUniqueId(),
            isActive: true,
        };

        testQnAData2 = {
            id: generateUniqueId(),
            hostId: generateUniqueId(),
            hostUserId: generateUniqueId(),
            title: generateUniqueId(),
            description: generateUniqueId(),
            conversationId: generateUniqueId(),
            tenantId: generateUniqueId(),
            isActive: true,
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('get all QnA sessions data', async () => {
        const testQnAData = [testQnAData1, testQnAData2];
        (<any>(
            qnaSessionDataService.getAllActiveQnASessionData
        )).mockImplementationOnce(() => {
            return testQnAData;
        });
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

        (<any>processQnASesssionsDataForMeetingTab).mockImplementationOnce(
            () => {
                return [qnaSessionDataObject1, qnaSessionDataObject2];
            }
        );

        const result = await request(app).get(
            `/api/conversations/${sampleConversationId}/activesessions`
        );

        expect(result).toBeDefined();
        const res = JSON.parse(result.text);
        expect(res).toBeDefined();
        expect(res.length).toEqual(2);
        expect(res[0]).toEqual(qnaSessionDataObject1);
        expect(res[1]).toEqual(qnaSessionDataObject2);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledTimes(1);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledWith(
            testQnAData
        );
    });

    it('get all QnA sessions data for internal server error', async () => {
        const testQnAData = [testQnAData1, testQnAData2];
        (<any>(
            qnaSessionDataService.getAllActiveQnASessionData
        )).mockImplementationOnce(() => {
            return testQnAData;
        });
        (<any>processQnASesssionsDataForMeetingTab).mockImplementationOnce(
            () => {
                throw new Error();
            }
        );
        const sampleConversationId = '1';
        const result = await request(app).get(
            `/api/conversations/${sampleConversationId}/activesessions`
        );
        expect(result.status).toBe(500);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledTimes(1);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledWith(
            testQnAData
        );
    });

    it('get all QnA sessions data for invalid conversation id ', async () => {
        const sampleInvalidConversationId = '1';
        const testQnAData = [];
        (<any>(
            qnaSessionDataService.getAllActiveQnASessionData
        )).mockImplementationOnce(() => {
            return testQnAData;
        });
        const result = await request(app).get(
            `/api/conversations/${sampleInvalidConversationId}/activesessions`
        );
        expect(result.status).toBe(204);
        expect(result.noContent).toBe(true);
        expect(processQnASesssionsDataForMeetingTab).toBeCalledTimes(0);
    });
});
