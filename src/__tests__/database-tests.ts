import * as mongoose from 'mongoose';
import { AMASession } from '../Data/Schemas/AMASession';
import {
    getQuestionData,
    createQuestion,
    getUserOrCreate,
    endAMASession,
    createAMASession,
    updateActivityId,
} from '../Data/Database';
import { Question, IQuestion } from '../Data/Schemas/Question';
import { User } from '../Data/Schemas/User';

let testHost, testAMASession, testUser;

// sample data used for tests
const sampleUserAADObjId = 'be36140g-9729-3024-8yg1-147bbi67g2c9';
const sampleUserName = 'Sample Name';
const sampleQuestionContent = 'Sample Question?';
const sampleAmaTeamsSessionId = '5ee25f76c7e152311cf94d99';
const title = 'testAMA';
const description = 'testDescription';
const userName = 'user';
const userAadObjId = 'aadObject';
const activityId = 'activityId';
const tenantId = 'tenantId';
const scopeId = 'scopeId';
const isChannel = true;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL as string, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    testHost = await new User({
        _id: '123',
        userName: 'Shayan Khalili',
    }).save();

    testAMASession = await new AMASession({
        title: 'test AMA',
        description: 'AMA session to test bot',
        isActive: true,
        hostId: '123',
        activityId: '456',
        tenantId: '789',
        scope: {
            scopeId: '123',
            isChannel: true,
        },
    }).save();

    testUser = await new User({
        _id: '456',
        userName: 'Khayan Shalili',
    }).save();
});

afterAll(async () => {
    await AMASession.remove({ _id: testAMASession._id });
    await User.remove({ _id: testHost._id });
    await User.remove({ _id: testUser._id });

    await mongoose.connection.close();
});

test('can create ama session', async () => {
    const result = await createAMASession(
        title,
        description,
        userName,
        userAadObjId,
        activityId,
        tenantId,
        scopeId,
        isChannel
    );

    expect(result.amaSessionId).toBeTruthy();
    expect(result.hostId).toBe(userAadObjId);

    const amaSessionDoc = await AMASession.findById(result.amaSessionId);

    expect(amaSessionDoc).not.toBeNull();
    const doc = (amaSessionDoc as any).toObject();

    const expectedData = {
        title: doc.title,
        description: doc.description,
        userAadObjId: doc.hostId,
        activityId: doc.activityId,
        tenantId: doc.tenantId,
        scopeId: doc.scope.scopeId,
        isChannel: doc.scope.isChannel,
        userName: userName,
    };

    expect(doc.isActive).toBe(true);
    expect(expectedData).toEqual({
        title,
        description,
        userName,
        userAadObjId,
        activityId,
        tenantId,
        scopeId,
        isChannel,
    });

    return;
});

test('can update activity id', async () => {
    /** Setup Mock DB **/
    const testAMASession = await new AMASession({
        title: 'test AMA',
        description: 'AMA session to test bot',
        isActive: true,
        hostId: '123',
        tenantId: '789',
        scope: {
            scopeId: '123',
            isChannel: true,
        },
    }).save();

    const activityId = '12345';
    await updateActivityId(testAMASession._id, activityId);

    const doc: any = await AMASession.findById(testAMASession);
    expect(doc).not.toBeNull();
    expect(doc._id).toEqual(testAMASession._id);
    expect(doc.toObject().activityId).toEqual(activityId);
});

test('retrieve question data in empty AMA', async () => {
    const questionData = await getQuestionData(testAMASession._id);
    expect(questionData).toEqual([]);
});

test('retrieve question data in non-empty AMA', async () => {
    const questions: IQuestion[] = [
        new Question({
            amaSessionId: testAMASession._id,
            userId: testUser._id,
            content: 'This is test question 1',
            voters: [],
        }),
        new Question({
            amaSessionId: testAMASession._id,
            userId: testUser._id,
            content: 'This is test question 2',
            voters: [],
        }),
    ];

    await questions[0].save();
    await questions[1].save();

    const questionData = await getQuestionData(testAMASession._id);

    expect(questionData[0]._id).toEqual(questions[0]._id);
    expect(questionData[1]._id).toEqual(questions[1]._id);

    await Question.remove({ _id: questionData[0]._id });
    await Question.remove({ _id: questionData[1]._id });
});

test('create new user', async () => {
    const data = await getUserOrCreate(sampleUserAADObjId, sampleUserName);
    expect(data).toBe(true);
});

test('update existing user', async () => {
    const randomString = Math.random().toString(36);
    const data = await getUserOrCreate(sampleUserAADObjId, randomString);
    expect(data).toBe(true);
});

test('new question with existing user', async () => {
    const data = await createQuestion(
        sampleAmaTeamsSessionId,
        sampleUserAADObjId,
        sampleUserName,
        sampleQuestionContent
    );
    expect(data).toEqual(true);
});

test('new question with new user', async () => {
    const randomString = Math.random().toString(36);
    const data = await createQuestion(
        sampleAmaTeamsSessionId,
        randomString,
        'Earnest Cream', //using same name and question because the bot only checks for AADObjId
        sampleQuestionContent
    );
    expect(data).toEqual(true);
});

test('ending ama with no questions', async () => {
    const result = await createAMASession(
        title,
        description,
        userName,
        userAadObjId,
        activityId,
        tenantId,
        scopeId,
        isChannel
    );

    const data = await endAMASession(result.amaSessionId);

    expect(data.amaDesc).toBe(description);
    expect(data.amaTitle).toBe(title);
});

test('ending ama with a few questions', async () => {
    const result = await createAMASession(
        title,
        description,
        userName,
        userAadObjId,
        activityId,
        tenantId,
        scopeId,
        isChannel
    );

    for (let i = 0; i < 5; i++) {
        const randomString = Math.random().toString(36);
        await createQuestion(
            result.amaSessionId,
            randomString,
            'Earnest Cream', //using same name and question because the bot only checks for AADObjId
            sampleQuestionContent
        );
    }

    const data = await endAMASession(result.amaSessionId);

    expect(data.amaDesc).toBe(description);
    expect(data.amaTitle).toBe(title);
});
