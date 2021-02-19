import Express from 'express';
import request from 'supertest';
import { Express as ExpressType } from 'express-serve-static-core';
import { router, initializeRouter } from 'src/routes/rest';
import { ConversationDataService, IQnASessionDataService, QnASessionDataService, UserDataService, IUserDataService, IQuestionDataService, QuestionDataService } from 'msteams-app-questionly.data';
import { getTeamsUserId } from 'src/routes/restUtils';
import { generateUniqueId } from 'adaptivecards';
import { Controller, IController } from 'src/controller';
import { StatusCodes } from 'http-status-codes';
import { getParticipantRole, isPresenterOrOrganizer } from 'src/util/meetingsUtility';
import { verifyUserFromConversationId } from 'msteams-app-questionly.common';
import { getMicrosoftAppPassword } from 'src/util/keyvault';
import { restApiErrorMiddleware } from 'src/routes/restApiErrorMiddleware';
import { errorMessages } from 'src/errors/errorMessages';
import { UnauthorizedAccessError, UnauthorizedAccessErrorCode } from 'src/errors/unauthorizedAccessError';
import { triggerBackgroundJobForQnaSessionCreatedEvent } from 'src/background-job/backgroundJobTrigger';
import { ClientDataContractFormatter, IClientDataContractFormatter } from 'src/util/clientDataContractFormatter';

let app: ExpressType;

const testUserId = 'testUserId';
const testUserName = 'testUserName';
const conversationDataService = new ConversationDataService();
const sampleConversationId = 'sampleConversationId';
const samplTtitle = 'sample title';
const sampleDescription = 'sample description';
const sampleScopeId = 'scoopeId';
const sampleHostId = 'sampleHostId';
const sampleHostUserId = 'sampleHostUserId';
const sampleMeetingId = 'sampleMeetingId';
const sampleUserId = 'sampleUserId';
const sampleUserName = 'sampleUserName';
const sampleQnASessionId = 'sampleQnASessionId';
const sampleServiceUrl = 'sampleServiceUrl';
const sampleTenantId = 'sampleTenantId';
let testQnAData1, testQnAData2;
let mockUserDataService: IUserDataService;
let mockQuestionDataService: IQuestionDataService;
let mockClientDataContractFormatter: IClientDataContractFormatter;
let mockController: IController;
let mockQnASessionDataService: IQnASessionDataService;

describe('test /conversations/:conversationId/sessions/:sessionId api', () => {
    const testError = new Error('test error');

    beforeAll(() => {
        app = Express();
        mockUserDataService = new UserDataService();
        mockQnASessionDataService = new QnASessionDataService(mockUserDataService);
        mockQuestionDataService = new QuestionDataService(mockUserDataService, mockQnASessionDataService);
        mockClientDataContractFormatter = new ClientDataContractFormatter(mockUserDataService, mockQuestionDataService);
        mockController = new Controller(mockQuestionDataService, mockQnASessionDataService);
        initializeRouter(conversationDataService, mockQnASessionDataService, mockClientDataContractFormatter, mockController);

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: sampleUserId,
                userName: sampleUserName,
            };
            next();
        };
        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
        app.use(restApiErrorMiddleware);

        (<any>verifyUserFromConversationId) = jest.fn();
        process.env.MicrosoftAppId = 'random';
        (<any>getMicrosoftAppPassword) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();
        (<any>mockClientDataContractFormatter.formatQnaSessionDataAsPerClientDataContract) = jest.fn();
        (<any>mockQnASessionDataService.getQnASessionData) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('validates get ama session api', async () => {
        const testSessionId = 'testId';

        const testQnASession = {
            title: generateUniqueId(),
            activityId: generateUniqueId(),
            conversationId: generateUniqueId(),
            hostId: { _id: generateUniqueId(), userName: generateUniqueId() },
            description: generateUniqueId(),
            hostUserId: generateUniqueId(),
            isActive: true,
        };

        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        (<any>mockQnASessionDataService.getQnASessionData) = jest.fn();
        (<any>mockQnASessionDataService.getQnASessionData).mockImplementationOnce(() => {
            return testQnASession;
        });

        const processedData = {
            sessionId: '1',
            title: generateUniqueId(),
            isActive: true,
            dateTimeCreated: generateUniqueId(),
            dateTimeEnded: generateUniqueId(),
            hostUser: { id: generateUniqueId(), name: generateUniqueId() },
            numberOfQuestions: 0,
        };

        (<any>mockClientDataContractFormatter.formatQnaSessionDataAsPerClientDataContract).mockImplementationOnce(() => {
            return processedData;
        });

        const result = await request(app).get(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`);

        expect(result).toBeDefined();
        expect(result.body).toBeDefined();
        expect(result.body).toEqual(processedData);
        expect(mockQnASessionDataService.getQnASessionData).toBeCalledTimes(1);
        expect(mockQnASessionDataService.getQnASessionData).toBeCalledWith(testSessionId);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('validates get ama session api - internal server error', async () => {
        const testSessionId = 'testId';

        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        (<any>mockQnASessionDataService.getQnASessionData).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).get(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`);

        expect(result).toBeDefined();
        expect(result.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.body.message).toEqual(testError.message);
    });

    it('validates get ama session api - user is not part of conversation', async () => {
        const testSessionId = 'testId';

        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return false;
        });

        const result = await request(app).get(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`);

        expect(result).toBeDefined();
        expect(result.status).toEqual(StatusCodes.FORBIDDEN);

        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });
});

describe('test conversations/:conversationId/sessions api', () => {
    beforeAll(async () => {
        app = Express();

        mockUserDataService = new UserDataService();
        mockQnASessionDataService = new QnASessionDataService(mockUserDataService);
        mockQuestionDataService = new QuestionDataService(mockUserDataService, mockQnASessionDataService);
        mockClientDataContractFormatter = new ClientDataContractFormatter(mockUserDataService, mockQuestionDataService);
        mockController = new Controller(mockQuestionDataService, mockQnASessionDataService);
        initializeRouter(conversationDataService, mockQnASessionDataService, mockClientDataContractFormatter, mockController);

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: sampleUserId,
                userName: sampleUserName,
            };
            next();
        };
        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
        app.use(restApiErrorMiddleware);
        (<any>mockQnASessionDataService.getAllQnASessionData) = jest.fn();
        (<any>mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract) = jest.fn();

        (<any>verifyUserFromConversationId) = jest.fn();
        process.env.MicrosoftAppId = 'random';
        (<any>getMicrosoftAppPassword) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();

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
        (<any>mockQnASessionDataService.getAllQnASessionData).mockImplementationOnce(() => {
            return testQnAData;
        });
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

        (<any>mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).mockImplementationOnce(() => {
            return [qnaSessionDataObject1, qnaSessionDataObject2];
        });

        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        const result = await request(app).get(`/api/conversations/${sampleConversationId}/sessions`);

        expect(result).toBeDefined();
        const res = JSON.parse(result.text);
        expect(res).toBeDefined();
        expect(res.length).toEqual(2);
        expect(res[0]).toEqual(qnaSessionDataObject1);
        expect(res[1]).toEqual(qnaSessionDataObject2);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledTimes(1);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledWith(testQnAData);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('get all QnA sessions data for internal server error', async () => {
        const testQnAData = [testQnAData1, testQnAData2];
        (<any>mockQnASessionDataService.getAllQnASessionData).mockImplementationOnce(() => {
            return testQnAData;
        });
        (<any>mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).mockImplementationOnce(() => {
            throw new Error();
        });

        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        const result = await request(app).get(`/api/conversations/${sampleConversationId}/sessions`);
        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledTimes(1);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledWith(testQnAData);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('user is not part of the conversation', async () => {
        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return false;
        });

        const result = await request(app).get(`/api/conversations/${sampleConversationId}/sessions`);

        expect(result.body.message).toEqual(errorMessages.UserIsNotPartOfConversationErrorMessage);
        expect(result.status).toBe(StatusCodes.FORBIDDEN);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('get all QnA sessions data for invalid conversation id ', async () => {
        const sampleInvalidConversationId = '1';
        const testQnAData = [];
        (<any>mockQnASessionDataService.getAllQnASessionData).mockImplementationOnce(() => {
            return testQnAData;
        });

        const testConversation = {
            _id: sampleInvalidConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        const result = await request(app).get(`/api/conversations/${sampleInvalidConversationId}/sessions`);
        expect(result.status).toBe(StatusCodes.OK);
        expect(JSON.parse(result.text)).toEqual([]);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledTimes(0);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleInvalidConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
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

        mockUserDataService = new UserDataService();
        mockQnASessionDataService = new QnASessionDataService(mockUserDataService);
        mockQuestionDataService = new QuestionDataService(mockUserDataService, mockQnASessionDataService);
        mockClientDataContractFormatter = new ClientDataContractFormatter(mockUserDataService, mockQuestionDataService);
        mockController = new Controller(mockQuestionDataService, mockQnASessionDataService);
        initializeRouter(conversationDataService, mockQnASessionDataService, mockClientDataContractFormatter, mockController);

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: sampleUserId,
                userName: sampleUserName,
            };
            next();
        };
        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
        app.use(restApiErrorMiddleware);

        (<any>isPresenterOrOrganizer) = jest.fn();
        (<any>getTeamsUserId) = jest.fn();
        (<any>mockQnASessionDataService.createQnASession) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();
        (<any>triggerBackgroundJobForQnaSessionCreatedEvent) = jest.fn(() => {
            return Promise.resolve(true);
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test post a qna session', async () => {
        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });
        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return true;
        });
        (<any>getTeamsUserId).mockImplementationOnce(() => {
            return sampleHostUserId;
        });
        (<any>mockQnASessionDataService.createQnASession).mockImplementationOnce(() => {
            return {
                qnaSessionId: sampleQnASessionId,
                hostId: sampleHostId,
            };
        });

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions`).send({
            title: samplTtitle,
            description: sampleDescription,
            scopeId: sampleScopeId,
            hostUserId: sampleHostId,
            isChannel: true,
        });
        expect(result).toBeDefined();
        expect(result.status).toBe(StatusCodes.OK);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(getTeamsUserId).toBeCalledTimes(1);
        expect(mockQnASessionDataService.createQnASession).toBeCalledTimes(1);
    });

    it('test post a qna session - createQnASession fails', async () => {
        const testError = new Error();
        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });
        (<any>isPresenterOrOrganizer).mockImplementationOnce(() => {
            return true;
        });
        (<any>getTeamsUserId).mockImplementationOnce(() => {
            return sampleHostUserId;
        });
        (<any>mockQnASessionDataService.createQnASession).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions`).send({
            title: samplTtitle,
            description: sampleDescription,
            scopeId: sampleScopeId,
        });
        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledTimes(1);
        expect(getTeamsUserId).toBeCalledTimes(1);
        expect(mockQnASessionDataService.createQnASession).toBeCalledTimes(1);
    });

    it('test post a qna session - getHostUserId fails', async () => {
        const testError = new Error();
        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });
        (<any>getTeamsUserId).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions`).send({
            title: samplTtitle,
            description: sampleDescription,
            scopeId: sampleScopeId,
            hostUserId: sampleHostId,
            isChannel: true,
        });
        expect(result.status).toBe(500);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(getTeamsUserId).toBeCalledTimes(1);
        expect(mockQnASessionDataService.createQnASession).toBeCalledTimes(0);
    });

    it('test post a qna session - getConversationData fails', async () => {
        const testError = new Error();
        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions`).send({
            title: samplTtitle,
            description: sampleDescription,
            scopeId: sampleScopeId,
            hostUserId: sampleHostId,
            isChannel: true,
        });
        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(isPresenterOrOrganizer).toBeCalledTimes(0);
        expect(getTeamsUserId).toBeCalledTimes(0);
        expect(mockQnASessionDataService.createQnASession).toBeCalledTimes(0);
    });

    it('test post a qna session - parameters missing in request payload', async () => {
        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions`).send({});
        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
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

        mockUserDataService = new UserDataService();
        mockQnASessionDataService = new QnASessionDataService(mockUserDataService);
        mockQuestionDataService = new QuestionDataService(mockUserDataService, mockQnASessionDataService);
        mockClientDataContractFormatter = new ClientDataContractFormatter(mockUserDataService, mockQuestionDataService);
        mockController = new Controller(mockQuestionDataService, mockQnASessionDataService);
        initializeRouter(conversationDataService, mockQnASessionDataService, mockClientDataContractFormatter, mockController);

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: testUserId,
                userName: testUserName,
            };
            next();
        };

        process.env.MicrosoftAppId = 'random';
        (<any>getMicrosoftAppPassword) = jest.fn();
        (<any>verifyUserFromConversationId) = jest.fn();
        (<any>mockController.submitNewQuestion) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();

        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
        app.use(restApiErrorMiddleware);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('questionContent missing in request', async () => {
        const testSessionId = 'testId';

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`);

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual("Parameter 'questionContent' is missing in the request");
    });

    it('questionContent as null in request', async () => {
        const testSessionId = 'testId';

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`).send({ questionContent: null });

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual("Parameter 'questionContent' is missing in the request");
    });

    it('questionContent as empty string in request', async () => {
        const testSessionId = 'testId';

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`).send({ questionContent: '' });

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual("Parameter 'questionContent' is missing in the request");
    });

    it('getConversationData throws error', async () => {
        const testSessionId = 'testId';
        const testError: Error = new Error('test error');
        const testQuestionContent = 'testQuestionContent';

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`).send({ questionContent: testQuestionContent });

        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.body.message).toEqual(testError.message);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
    });

    it('user is not part of conversation', async () => {
        const testSessionId = 'testId';
        const testQuestionContent = 'testQuestionContent';

        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });
        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return false;
        });

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`).send({ questionContent: testQuestionContent });

        expect(result.status).toBe(StatusCodes.FORBIDDEN);
        expect(result.body.message).toEqual(errorMessages.UserIsNotPartOfConversationErrorMessage);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('submitNewQuestion throws error', async () => {
        const testSessionId = 'testId';
        const testError: Error = new Error('Failed to submit new question');
        const testQuestionContent = 'testQuestionContent';

        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });
        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        (<any>mockController.submitNewQuestion).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).post(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`).send({ questionContent: testQuestionContent });

        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.body.message).toEqual(testError.message);
        expect(mockController.submitNewQuestion).toBeCalledTimes(1);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
    });

    it('create question successfully', async () => {
        const testSessionId = 'testId';
        const questionId = 'testQuestionId';
        const testQuestionContent = 'testQuestionContent';
        const questionRes = {
            _id: questionId,
            voters: [],
            isAnswered: new Boolean(true),
        };

        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };
        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });
        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });
        (<any>mockController.submitNewQuestion).mockImplementationOnce(() => {
            return questionRes;
        });

        const result = await request(app)
            .post(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions`)
            .send({ questionContent: testQuestionContent })
            .accept('application/json');

        expect(result.status).toBe(StatusCodes.CREATED);
        expect(result.body.id).toEqual('testQuestionId');
        expect(mockController.submitNewQuestion).toBeCalledTimes(1);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
    });
});

describe('test /conversations/:conversationId/me api', () => {
    beforeAll(() => {
        app = Express();

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: testUserId,
                userName: testUserName,
            };
            next();
        };

        mockUserDataService = new UserDataService();
        mockQnASessionDataService = new QnASessionDataService(mockUserDataService);
        mockQuestionDataService = new QuestionDataService(mockUserDataService, mockQnASessionDataService);
        mockClientDataContractFormatter = new ClientDataContractFormatter(mockUserDataService, mockQuestionDataService);
        mockController = new Controller(mockQuestionDataService, mockQnASessionDataService);
        initializeRouter(conversationDataService, mockQnASessionDataService, mockClientDataContractFormatter, mockController);

        (<any>getParticipantRole) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();

        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
        app.use(restApiErrorMiddleware);
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
        const response = {
            userRole: testRole,
            userName: testUserName,
            userId: testUserId,
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>getParticipantRole).mockImplementationOnce(() => {
            return testRole;
        });

        const result = await request(app).get(`/api/conversations/${testConversation._id}/me`);

        expect(result).toBeDefined();
        expect(result.body).toEqual(response);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(testConversation._id);
        expect(getParticipantRole).toBeCalledTimes(1);
        expect(getParticipantRole).toBeCalledWith(testConversation.meetingId, testUserId, testConversation.tenantId, testConversation.serviceUrl);
    });

    it('validates me api - getParticipantRole throws error', async () => {
        const testConversation = {
            _id: 'testConvId',
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        const testError = new Error('test error');

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>getParticipantRole).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).get(`/api/conversations/${testConversation._id}/me`);

        expect(result).toBeDefined();
        expect(result.body.message).toEqual(testError.message);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(testConversation._id);
        expect(getParticipantRole).toBeCalledTimes(1);
        expect(getParticipantRole).toBeCalledWith(testConversation.meetingId, testUserId, testConversation.tenantId, testConversation.serviceUrl);
    });

    it('validates me api - meeting id not associated with conversation', async () => {
        const testConversation = {
            _id: 'testConvId',
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        const result = await request(app).get(`/api/conversations/${testConversation._id}/me`);

        expect(result).toBeDefined();
        expect(result.body.message).toEqual(errorMessages.ConversationDoesNotBelongToMeetingChatErrorMessage);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(testConversation._id);
    });

    it('validates me api - getParticipantRole throws error', async () => {
        const testConversation = {
            _id: 'testConvId',
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        const testError = new Error('test error');

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).get(`/api/conversations/${testConversation._id}/me`);

        expect(result).toBeDefined();
        expect(result.body.message).toEqual(testError.message);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(testConversation._id);
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

        mockUserDataService = new UserDataService();
        mockQnASessionDataService = new QnASessionDataService(mockUserDataService);
        mockQuestionDataService = new QuestionDataService(mockUserDataService, mockQnASessionDataService);
        mockClientDataContractFormatter = new ClientDataContractFormatter(mockUserDataService, mockQuestionDataService);
        mockController = new Controller(mockQuestionDataService, mockQnASessionDataService);
        initializeRouter(conversationDataService, mockQnASessionDataService, mockClientDataContractFormatter, mockController);

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: testUserId,
                userName: testUserName,
            };
            next();
        };

        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
        app.use(restApiErrorMiddleware);

        (<any>mockController.upvoteQuestion) = jest.fn();
        (<any>mockController.downvoteQuestion) = jest.fn();
        (<any>mockController.markQuestionAsAnswered) = jest.fn();
        (<any>isPresenterOrOrganizer) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();
        process.env.MicrosoftAppId = 'random';
        (<any>getMicrosoftAppPassword) = jest.fn();
        (<any>verifyUserFromConversationId) = jest.fn();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    it('patch action missing in request', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`);

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual("Parameter 'action' is missing in the request");
    });

    it('patch action as null in request', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: null });

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual("Parameter 'action' is missing in the request");
    });

    it('patch action as empty string in request', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: '' });

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual("Parameter 'action' is missing in the request");
    });

    it('invalid patch action in request', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';
        const randomAction = 'randomaction';

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: randomAction });

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual(`action ${randomAction} is not supported`);
    });

    it('upVoteQuestion api throws error for upvote action', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';
        const testError: Error = new Error('test error');

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        (<any>mockController.upvoteQuestion).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: 'upvote' });

        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.body.message).toEqual(testError.message);
        expect(mockController.upvoteQuestion).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('upVote question action', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        (<any>mockController.upvoteQuestion).mockImplementationOnce(() => {
            return {
                _id: testQuestionId,
                userId: { _id: testUserId, userName: testUserName },
                voters: [],
                isAnswered: new Boolean(true),
            };
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: 'upvote' });

        expect(result.status).toBe(StatusCodes.OK);
        expect(result.body.id).toEqual(testQuestionId);
        expect(mockController.upvoteQuestion).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('user is not part of conversation', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return false;
        });
        (<any>mockController.downvoteQuestion).mockImplementationOnce(() => {
            return;
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: 'upvote' });

        expect(result.status).toBe(StatusCodes.FORBIDDEN);
        expect(result.body.message).toEqual(errorMessages.UserIsNotPartOfConversationErrorMessage);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('downVote question action', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });
        (<any>mockController.downvoteQuestion).mockImplementationOnce(() => {
            return {
                _id: testQuestionId,
                userId: { _id: testUserId, userName: testUserName },
                voters: [],
                isAnswered: new Boolean(true),
            };
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: 'downvote' });

        expect(result.status).toBe(StatusCodes.OK);
        expect(result.body.id).toEqual(testQuestionId);
        expect(mockController.downvoteQuestion).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('downVoteQuestion api throws error for downvote action', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';
        const testError: Error = new Error('test error');

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });
        (<any>mockController.downvoteQuestion).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: 'downvote' });

        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.body.message).toEqual(testError.message);
        expect(mockController.downvoteQuestion).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('user is not part of conversation', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return false;
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: 'downvote' });

        expect(result.status).toBe(StatusCodes.FORBIDDEN);
        expect(result.body.message).toEqual(errorMessages.UserIsNotPartOfConversationErrorMessage);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('markQuestionAsAnswered api throws error for markAnswered action', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';
        const testError: Error = new Error('test error');
        const testConversationData = {
            _id: sampleConversationId,
            serviceUrl: sampleServiceUrl,
            tenantId: sampleTenantId,
            meetingId: sampleMeetingId,
        };

        (<any>mockController.markQuestionAsAnswered).mockImplementationOnce(() => {
            throw testError;
        });

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversationData;
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: 'markAnswered' });

        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.body.message).toEqual(testError.message);
        expect(mockController.markQuestionAsAnswered).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
    });

    it('markAnswered question action', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';
        const testConversationData = {
            _id: sampleConversationId,
            serviceUrl: sampleServiceUrl,
            tenantId: sampleTenantId,
            meetingId: sampleMeetingId,
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversationData;
        });

        (<any>mockController.markQuestionAsAnswered).mockImplementationOnce(() => {
            return {
                _id: testQuestionId,
                userId: { _id: testUserId, userName: testUserName },
                voters: [],
                isAnswered: new Boolean(true),
            };
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: 'markAnswered' });

        expect(result.status).toBe(StatusCodes.OK);
        expect(result.body.id).toEqual(testQuestionId);
        expect(mockController.markQuestionAsAnswered).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
    });

    it('markAnswered question action - user is not presenter or organizer', async () => {
        const testSessionId = 'testId';
        const testQuestionId = 'q1';

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });

        (<any>mockController.markQuestionAsAnswered).mockImplementationOnce(() => {
            throw new UnauthorizedAccessError(UnauthorizedAccessErrorCode.InsufficientPermissionsToMarkQuestionAsAnswered);
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}/questions/${testQuestionId}`).send({ action: 'markAnswered' });

        expect(result.status).toBe(StatusCodes.FORBIDDEN);
        expect(result.body.message).toEqual('Only a Presenter or an Organizer can mark question as answered.');
        expect(<any>conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
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

        mockUserDataService = new UserDataService();
        mockQnASessionDataService = new QnASessionDataService(mockUserDataService);
        mockQuestionDataService = new QuestionDataService(mockUserDataService, mockQnASessionDataService);
        mockClientDataContractFormatter = new ClientDataContractFormatter(mockUserDataService, mockQuestionDataService);
        mockController = new Controller(mockQuestionDataService, mockQnASessionDataService);
        initializeRouter(conversationDataService, mockQnASessionDataService, mockClientDataContractFormatter, mockController);

        app.use(Express.urlencoded({ extended: true }));

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: testUserId,
                userName: testUserName,
            };
            next();
        };

        (<any>mockController.endQnASession) = jest.fn();
        (<any>isPresenterOrOrganizer) = jest.fn();
        (<any>getTeamsUserId) = jest.fn();
        (<any>conversationDataService.getConversationData) = jest.fn();

        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
        app.use(restApiErrorMiddleware);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('patch action is missing in request', async () => {
        const testSessionId = 'testId';

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`);

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual("Parameter 'action' is missing in the request");
    });

    it('patch action as null in request', async () => {
        const testSessionId = 'testId';

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`).send({ action: null });

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual("Parameter 'action' is missing in the request");
    });

    it('patch action as empty string in request', async () => {
        const testSessionId = 'testId';

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`).send({ action: '' });

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual("Parameter 'action' is missing in the request");
    });

    it('invalid patch action in request', async () => {
        const testSessionId = 'testId';
        const randomAction = 'randomaction';

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`).send({ action: randomAction });

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.message).toEqual(`action ${randomAction} is not supported`);
    });

    it('endQnASession api throws error', async () => {
        const testSessionId = 'testId';
        const testError: Error = new Error('test error');

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });
        (<any>getTeamsUserId).mockImplementationOnce(() => {
            return sampleHostUserId;
        });
        (<any>mockController.endQnASession).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`).send({ action: 'end' });

        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.body.message).toEqual(testError.message);
        expect(mockController.endQnASession).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
    });

    it('getConversationData api throws error', async () => {
        const testSessionId = 'testId';
        const testError: Error = new Error('test error');

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            throw testError;
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`).send({ action: 'end' });

        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.body.message).toEqual(testError.message);
        expect(<any>conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
    });

    it('end session action', async () => {
        const testSessionId = 'testId';

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return {
                _id: sampleConversationId,
                serviceUrl: sampleServiceUrl,
                tenantId: sampleTenantId,
                meetingId: sampleMeetingId,
            };
        });
        (<any>getTeamsUserId).mockImplementationOnce(() => {
            return sampleHostUserId;
        });

        const result = await request(app).patch(`/api/conversations/${sampleConversationId}/sessions/${testSessionId}`).send({ action: 'end' });

        expect(result.status).toBe(StatusCodes.NO_CONTENT);
        expect(result.noContent).toBeTruthy();
        expect(mockController.endQnASession).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(<any>conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
    });
});

describe('test get /:conversationId/activesessions api', () => {
    beforeAll(async () => {
        app = Express();

        mockUserDataService = new UserDataService();
        mockQnASessionDataService = new QnASessionDataService(mockUserDataService);
        mockQuestionDataService = new QuestionDataService(mockUserDataService, mockQnASessionDataService);
        mockClientDataContractFormatter = new ClientDataContractFormatter(mockUserDataService, mockQuestionDataService);
        mockController = new Controller(mockQuestionDataService, mockQnASessionDataService);
        initializeRouter(conversationDataService, mockQnASessionDataService, mockClientDataContractFormatter, mockController);

        (<any>conversationDataService.getConversationData) = jest.fn();
        process.env.MicrosoftAppId = 'random';
        (<any>getMicrosoftAppPassword) = jest.fn();
        (<any>verifyUserFromConversationId) = jest.fn();

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: sampleUserId,
                userName: sampleUserName,
            };
            next();
        };
        // Rest endpoints
        app.use('/api/conversations', mockEnsureAuthenticated, router);
        app.use(restApiErrorMiddleware);

        (<any>mockQnASessionDataService.getAllActiveQnASessionData) = jest.fn();
        (<any>mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract) = jest.fn();

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
        (<any>mockQnASessionDataService.getAllActiveQnASessionData).mockImplementationOnce(() => {
            return testQnAData;
        });

        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

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

        (<any>mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).mockImplementationOnce(() => {
            return [qnaSessionDataObject1, qnaSessionDataObject2];
        });

        const result = await request(app).get(`/api/conversations/${sampleConversationId}/activesessions`);

        expect(result).toBeDefined();
        const res = JSON.parse(result.text);
        expect(res).toBeDefined();
        expect(res.length).toEqual(2);
        expect(res[0]).toEqual(qnaSessionDataObject1);
        expect(res[1]).toEqual(qnaSessionDataObject2);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledTimes(1);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledWith(testQnAData);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('get all QnA sessions data for internal server error', async () => {
        const testQnAData = [testQnAData1, testQnAData2];
        (<any>mockQnASessionDataService.getAllActiveQnASessionData).mockImplementationOnce(() => {
            return testQnAData;
        });
        (<any>mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).mockImplementationOnce(() => {
            throw new Error();
        });
        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        const result = await request(app).get(`/api/conversations/${sampleConversationId}/activesessions`);
        expect(result.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledTimes(1);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledWith(testQnAData);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('get all QnA sessions data for invalid conversation id ', async () => {
        const sampleInvalidConversationId = '1';
        const testQnAData = [];
        (<any>mockQnASessionDataService.getAllActiveQnASessionData).mockImplementationOnce(() => {
            return testQnAData;
        });

        const testConversation = {
            _id: sampleInvalidConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        const result = await request(app).get(`/api/conversations/${sampleInvalidConversationId}/activesessions`);
        expect(result.status).toBe(StatusCodes.OK);
        expect(JSON.parse(result.text)).toEqual([]);
        expect(mockClientDataContractFormatter.formatQnaSessionDataArrayAsPerClientDataContract).toBeCalledTimes(0);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleInvalidConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('user is not part of conversation', async () => {
        const testConversation = {
            _id: sampleConversationId,
            serviceUrl: 'testServiceUrl',
            tenantId: 'testTenantId',
            meetingId: 'testMeetingId',
        };

        (<any>conversationDataService.getConversationData).mockImplementationOnce(() => {
            return testConversation;
        });

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return false;
        });

        const result = await request(app).get(`/api/conversations/${sampleConversationId}/activesessions`);
        expect(result.status).toBe(StatusCodes.FORBIDDEN);
        expect(result.body.message).toEqual(errorMessages.UserIsNotPartOfConversationErrorMessage);
        expect(conversationDataService.getConversationData).toBeCalledTimes(1);
        expect(conversationDataService.getConversationData).toBeCalledWith(sampleConversationId);
        expect(verifyUserFromConversationId).toBeCalledTimes(1);
    });
});
