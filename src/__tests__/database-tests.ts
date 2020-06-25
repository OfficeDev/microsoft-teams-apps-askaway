import {
    getQuestionData,
    createQuestion,
    getUserOrCreate,
} from '../Data/Database';
import { AMASession } from '../Data/Schemas/AMASession';
import { Question } from '../Data/Schemas/Question';
import { User } from '../Data/Schemas/User';
import * as mongoose from 'mongoose';

let testHost, testAMASession, testUser;

const sampleUserAADObjId = 'be36140g-9729-3024-8yg1-147bbi67g2c9';
const sampleUserName = 'Sample Name';
const sampleQuestionContent = 'Sample Question?';
const sampleAmaTeamsSessionId = '5ee25f76c7e152311cf94d99';

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

test('retrieve question data in empty AMA', async () => {
    const questionData = await getQuestionData(testAMASession._id);
    expect(questionData).toEqual([]);
});

test('retrieve question data in non-empty AMA', async () => {
    let questions = [
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

    questions = await User.populate(questions, { path: 'userId' });

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
        'Earnest Cream', //using same name and question because only checks AADObjId
        sampleQuestionContent
    );
    expect(data).toEqual(true);
});
