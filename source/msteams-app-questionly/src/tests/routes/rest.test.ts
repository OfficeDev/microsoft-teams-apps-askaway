import Express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { Express as ExpressType } from 'express-serve-static-core';
import { router } from 'src/routes/rest';
import { IQnASession, QnASession } from 'src/data/schemas/qnaSession';
import { IUser, User } from 'src/data/schemas/user';
import { IQuestion, Question } from 'src/data/schemas/question';
import { getAllQnASesssionsDataForTab } from 'src/routes/restUtils';

let app: ExpressType;
let testQnASession: IQnASession;
let testQuestion1: IQuestion;
let testQuestion2: IQuestion;
let testUser: IUser;
const testUserId = 'be36140g-9729-3024-8yg1-147bbi67g2c9';
const testUserName = 'User name';
const sampleActivityId = '1234';
const sampleHostUserId = '5f160b862655575054393a0e';
const sampleTitle = 'sampleTitle';
const sampleDescription = 'Weekly QnA Test description';
const sampleConversationId = '8293';
const sampleTenantId = '11121';
const sampleScopeId = '12311';

const createDummyQnAsession = async (): Promise<void> => {
    testUser = await new User({
        _id: testUserId,
        userName: testUserName,
    }).save();

    testQnASession = await new QnASession({
        title: sampleTitle,
        description: sampleDescription,
        isActive: true,
        hostId: testUserId,
        activityId: sampleActivityId,
        conversationId: sampleConversationId,
        tenantId: sampleTenantId,
        hostUserId: sampleHostUserId,
        scope: {
            scopeId: sampleScopeId,
            isChannel: true,
        },
    }).save();
};

const createQuestionData = async (): Promise<void> => {
    testQuestion1 = await new Question({
        qnaSessionId: testQnASession._id,
        userId: testUser._id,
        content: 'This is test question 1',
        voters: [],
    }).save();

    testQuestion2 = await new Question({
        qnaSessionId: testQnASession._id,
        userId: testUser._id,
        content: 'This is test question 1',
        voters: [],
    }).save();
};

// Test cases will be improved as part of rest api TASK 1211744, this is a boilerplate code.
describe('test /conversations/:conversationId/sessions/:sessionId api', () => {
    beforeAll(async () => {
        await mongoose.connect(<string>process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });

        await createDummyQnAsession();
        app = Express();

        // Rest endpoints
        app.use('/api/conversations', router);
    });

    afterAll(async () => {
        await QnASession.remove({ _id: testQnASession._id });
        await User.remove({ _id: testUserId });
        await mongoose.connection.close();
    });

    it('validates get ama session api', async () => {
        const result = await request(app).get(
            `/api/conversations/1/sessions/${testQnASession._id.toString()}`
        );

        expect(result).toBeDefined();
        expect(result.body.title).toEqual(sampleTitle);
        expect(result.body.activityId).toEqual(sampleActivityId);
        expect(result.body.description).toEqual(sampleDescription);
        expect(result.body.conversationId).toEqual(sampleConversationId);
    });
});

describe('test conversations/:conversationId/sessions api', () => {
    beforeAll(async () => {
        await mongoose.connect(<string>process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });

        await createDummyQnAsession();
        await createQuestionData();
        app = Express();

        // Rest endpoints
        app.use('/api/conversations', router);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await QnASession.remove({ _id: testQnASession._id });
        await User.remove({ _id: testUserId });
        await Question.remove({ _id: testQuestion1._id });
        await Question.remove({ _id: testQuestion2._id });
        await mongoose.connection.close();
    });

    it('get all QnA sessions data', async () => {
        const result = await request(app).get(
            `/api/conversations/${sampleConversationId}/sessions`
        );
        const res = JSON.parse(result.text)[0];
        expect(res.title).toEqual(sampleTitle);
        expect(res.isActive).toEqual(true);
        expect(res.hostUser.id).toEqual(testUserId);
        expect(res.hostUser.name).toEqual(testUserName);
        expect(res.numberOfQuestions).toEqual(2);
    });

    it('get all QnA sessions data for invalid conversation id ', async () => {
        const result = await request(app).get(`/api/conversations/1/sessions`);
        expect(result.noContent).toBe(true);
    });

    it('get all QnA sessions data for internal server error', async () => {
        (<any>getAllQnASesssionsDataForTab) = jest.fn();
        (<any>getAllQnASesssionsDataForTab).mockImplementationOnce(() => {
            throw new Error();
        });
        const result = await request(app).get(
            `/api/conversations/${sampleConversationId}/sessions`
        );
        expect(result.status).toBe(500);
    });
});
