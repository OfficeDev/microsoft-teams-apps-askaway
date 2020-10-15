import Express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { router } from '../../routes/rest';
import { QnASession } from 'src/Data/Schemas/QnASession';
import { User } from 'src/Data/Schemas/user';

const app = Express();
const testUserId = 'be36140g-9729-3024-8yg1-147bbi67g2c9';
const testUserName = 'User name';
const sampleActivityId = '1234';
const sampleHostUserId = '5f160b862655575054393a0e';
const sampleTitle = 'sampleTitle';
const sampleDescription = 'Weekly QnA Test description';
const sampleConversationId = '8293';
const sampleTenantId = '11121';
const sampleScopeId = '12311';
let testQnASession;
// Rest endpoints
app.use('/api/conversations', router);

const createDummyQnAsession = async (): Promise<void> => {
    await new User({
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

// Test cases will be improved as part of rest api TASK 1211744, this is a boilerplate code.
describe('test /conversations/:conversationId/sessions/:sessionId api', () => {
    beforeAll(async (done) => {
        await mongoose.connect(<string>process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });

        await createDummyQnAsession();
        done();
    });

    test('validate ama session api', async () => {
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
