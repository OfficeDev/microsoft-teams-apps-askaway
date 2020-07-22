import mongoose from 'mongoose';
import { QnASession } from '../Data/Schemas/QnASession';
import {
    getQuestionData,
    createQuestion,
    getUserOrCreate,
    addUpvote,
    endQnASession,
    createQnASession,
    updateActivityId,
    getQnASessionData,
    getQuestions,
    isHost,
    isActiveQnA,
    isExistingQnASession,
} from '../Data/Database';
import { Question, IQuestion } from '../Data/Schemas/Question';
import { User } from '../Data/Schemas/User';

let testHost, testQnASession, testUser, testUserUpvoting;

const sampleUserAADObjId1 = 'be36140g-9729-3024-8yg1-147bbi67g2c9';
const sampleUserAADObjId2 = 'different from obj id 1';
const sampleUserAADObjId3 = 'different fr0m obj id 0';
const sampleUserAADObjId4 = 'different from obj id 2';
const sampleUserName1 = 'Shayan Khalili';
const sampleUserName2 = 'Lily Du';
const sampleUserName3 = 'Kavin Singh';
const sampleUserName4 = 'Sample Name';
const sampleQuestionContent = 'Sample Question?';
const sampleTitle = 'Weekly QnA Test';
const sampleDescription = 'Weekly QnA Test description';
const sampleActivityId = '1234';
const sampleTenantId = '11121';
const sampleScopeId = '12311';
const sampleQnASessionID = '5f160b862655575054393a0e';

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL as string, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    });
});

beforeEach(async () => {
    testHost = await new User({
        _id: sampleUserAADObjId1,
        userName: sampleUserName1,
    }).save();

    testQnASession = await new QnASession({
        title: sampleTitle,
        description: sampleDescription,
        isActive: true,
        hostId: sampleUserAADObjId1,
        activityId: sampleActivityId,
        tenantId: sampleTenantId,
        scope: {
            scopeId: sampleScopeId,
            isChannel: true,
        },
    }).save();

    testUser = await new User({
        _id: sampleUserAADObjId2,
        userName: sampleUserName2,
    }).save();

    testUserUpvoting = await new User({
        _id: sampleUserAADObjId3,
        userName: sampleUserName3,
    }).save();
});

afterEach(async () => {
    await QnASession.remove({ _id: testQnASession._id });
    await User.remove({ _id: testHost._id });
    await User.remove({ _id: testUser._id });
    await User.remove({ _id: testUserUpvoting._id });
});

afterAll(async () => {
    await mongoose.connection.close();
});

test('can create qna session', async () => {
    const data = {
        title: sampleTitle,
        description: sampleDescription,
        userName: sampleUserName1,
        userAadObjId: sampleUserAADObjId1,
        activityId: sampleActivityId,
        tenantId: sampleTenantId,
        scopeId: sampleScopeId,
        isChannel: true,
    };

    const result = await createQnASession(
        data.title,
        data.description,
        data.userName,
        data.userAadObjId,
        data.activityId,
        data.tenantId,
        data.scopeId,
        data.isChannel
    );

    expect(result.qnaSessionId).toBeTruthy();
    expect(result.hostId).toBe(data.userAadObjId);

    const qnaSessionDoc = await QnASession.findById(result.qnaSessionId);

    expect(qnaSessionDoc).not.toBeNull();
    const doc = (qnaSessionDoc as any).toObject();

    const expectedData = {
        title: doc.title,
        description: doc.description,
        userAadObjId: doc.hostId,
        activityId: doc.activityId,
        tenantId: doc.tenantId,
        scopeId: doc.scope.scopeId,
        isChannel: doc.scope.isChannel,
        userName: data.userName,
    };

    expect(doc.isActive).toBe(true);
    expect(expectedData).toEqual(data);

    return;
});

test('can update activity id', async () => {
    const activityId = '12345';
    await updateActivityId(testQnASession._id, activityId);

    const doc: any = await QnASession.findById(testQnASession._id);
    expect(doc).not.toBeNull();
    expect(doc._id).toEqual(testQnASession._id);
    expect(doc.toObject().activityId).toEqual(activityId);
});

test('get QnA session data', async () => {
    const {
        title,
        userName,
        activityId,
        userAadObjId,
        description,
        isActive,
    } = await getQnASessionData(testQnASession._id);

    expect(title).toBe(sampleTitle);
    expect(userName).toBe(sampleUserName1);
    expect(activityId).toBe(sampleActivityId);
    expect(userAadObjId).toBe(sampleUserAADObjId1);
    expect(description).toBe(sampleDescription);
    expect(isActive).toBe(true);
});

test('retrieve most recent/top questions with three questions', async () => {
    const doc: any = await QnASession.findById(testQnASession._id);
    expect(doc).not.toBeNull();

    // create a new questions
    const questions: any = [
        {
            qnaSessionId: testQnASession._id,
            userId: testUser._id,
            content: 'This is test question 1',
            voters: [
                {
                    _id: '456',
                    userName: 'Khayan Shalili',
                },
                {
                    _id: '456',
                    userName: 'Khayan Shalili',
                },
            ],
        },
        {
            qnaSessionId: testQnASession._id,
            userId: testUser._id,
            content: 'This is test question 2',
            voters: [],
        },
        {
            qnaSessionId: testQnASession._id,
            userId: testUser._id,
            content: 'This is test question 3',
            voters: [
                {
                    _id: '456',
                    userName: 'Khayan Shalili',
                },
            ],
        },
    ];

    const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    questions[1] = await new Question(questions[1]).save();
    await _sleep(50);
    questions[0] = await new Question(questions[0]).save();
    await _sleep(1000);
    questions[2] = await new Question(questions[2]).save();

    const results = await getQuestions(testQnASession._id, 3, 3);
    const topQuestions: any = results.topQuestions;
    const recentQuestions: any = results.recentQuestions;
    const numQuestions = results.numQuestions;

    expect(topQuestions).not.toBe(null);
    expect(recentQuestions).not.toBe(null);
    expect(numQuestions).toEqual(3);

    expect(topQuestions[0]._id).toEqual(questions[0]._id);
    expect(topQuestions[1]._id).toEqual(questions[2]._id);
    expect(topQuestions[2]._id).toEqual(questions[1]._id);

    expect(recentQuestions[0]._id).toEqual(questions[2]._id);
    expect(recentQuestions[1]._id).toEqual(questions[0]._id);
    expect(recentQuestions[2]._id).toEqual(questions[1]._id);

    // cleanup
    await Question.remove({ qnaSessionId: testQnASession._id });
});

test('retrieve most recent/top questions with no questions', async () => {
    const doc: any = await QnASession.findById(testQnASession._id);
    expect(doc).not.toBeNull();

    const results = await getQuestions(testQnASession._id, 3, 3);
    const topQuestions: any = results.topQuestions;
    const recentQuestions: any = results.recentQuestions;
    const numQuestions: any = results.numQuestions;

    expect(topQuestions).toEqual([]);
    expect(recentQuestions).toEqual([]);
    expect(numQuestions).toEqual(0);
    // cleanup
    await Question.remove({ qnaSessionId: testQnASession._id });
});

test('retrieve question data in empty QnA', async () => {
    const questionData = await getQuestionData(testQnASession._id);
    expect(questionData).toEqual([]);
});

test('retrieve question data in non-empty QnA', async () => {
    const questions: IQuestion[] = [
        new Question({
            qnaSessionId: testQnASession._id,
            userId: testUser._id,
            content: 'This is test question 1',
            voters: [],
        }),
        new Question({
            qnaSessionId: testQnASession._id,
            userId: testUser._id,
            content: 'This is test question 2',
            voters: [],
        }),
    ];

    await questions[0].save();
    await questions[1].save();

    const questionData = await getQuestionData(testQnASession._id);

    expect(questionData[0]._id).toEqual(questions[0]._id);
    expect(questionData[1]._id).toEqual(questions[1]._id);

    await Question.remove({ _id: questionData[0]._id });
    await Question.remove({ _id: questionData[1]._id });
});

test('create new user', async () => {
    const data = await getUserOrCreate(sampleUserAADObjId1, sampleUserName1);
    expect(data).toBe(true);
});

test('update existing user', async () => {
    const randomString = Math.random().toString(36);
    const data = await getUserOrCreate(sampleUserAADObjId1, randomString);
    expect(data).toBe(true);
});

test('new question with existing user in existing QnA session', async () => {
    const data = await createQuestion(
        testQnASession._id,
        testUser._id,
        testUser.userName,
        sampleQuestionContent
    );
    expect(data).toEqual(true);
});

test('new question with new user in existing QnA session', async () => {
    const data = await createQuestion(
        testQnASession._id,
        sampleUserAADObjId4,
        sampleUserName4,
        sampleQuestionContent
    );
    expect(data).toEqual(true);
});

test('new question with existing user in non-existing QnA session', async () => {
    await createQuestion(
        sampleQnASessionID,
        sampleUserAADObjId4,
        sampleUserName4,
        sampleQuestionContent
    ).catch((error) => {
        expect(error).toEqual(new Error('QnA Session record not found'));
    });
});

test('get non-existing QnA session', async () => {
    await isExistingQnASession(sampleQnASessionID).catch((error) => {
        expect(error).toEqual(new Error('QnA Session record not found'));
    });
});

test('get existing QnA session', async () => {
    const data = await isExistingQnASession(testQnASession._id);
    expect(data).toEqual(true);
});

test('upvote question that has not been upvoted yet with existing user', async () => {
    const newQuestion = new Question({
        qnaSessionId: testQnASession._id,
        userId: testUser._id,
        content: 'This is a question to test upvotes?',
        voters: [],
    });

    await newQuestion.save();

    const questionUpvoted = await addUpvote(
        newQuestion._id,
        testUserUpvoting._id,
        testUserUpvoting.userName
    );

    expect(questionUpvoted.voters).toContain(testUserUpvoting._id);

    await Question.remove(questionUpvoted);
    await User.remove(testUserUpvoting);
});

test('upvote question that has already been upvoted with existing user', async () => {
    const newQuestion = new Question({
        qnaSessionId: testQnASession._id,
        userId: testUser._id,
        content: 'This is a question to test upvotes?',
        voters: [],
    });

    await newQuestion.save();

    let questionUpvoted = await addUpvote(
        newQuestion._id,
        testUserUpvoting._id,
        testUserUpvoting.userName
    );

    expect(questionUpvoted.voters).toContain(testUserUpvoting._id);

    questionUpvoted = await addUpvote(
        newQuestion._id,
        testUserUpvoting._id,
        testUserUpvoting.userName
    );

    expect(questionUpvoted.voters).toContain(testUserUpvoting._id);

    expect(
        questionUpvoted.voters.filter(
            (userId) => userId === testUserUpvoting._id
        ).length
    ).toEqual(1);

    await Question.remove(questionUpvoted);
    await User.remove(testUserUpvoting);
});

test('upvote question with new user not in database', async () => {
    const newQuestion = new Question({
        qnaSessionId: testQnASession._id,
        userId: testUser._id,
        content: 'This is a question to test upvotes?',
        voters: [],
    });

    await newQuestion.save();

    const questionUpvoted = await addUpvote(
        newQuestion._id,
        '134679',
        'New User Junior'
    );

    expect(questionUpvoted.voters).toContain('134679');

    await Question.remove(questionUpvoted);
    await User.remove(testUserUpvoting);
});

test('ending non-existing qna', async () => {
    await endQnASession(sampleQnASessionID).catch((error) => {
        expect(error).toEqual(new Error('QnA Session record not found'));
    });
});

test('ending existing qna with no questions', async () => {
    await endQnASession(testQnASession._id);

    // get data
    const qnaSessionData: any = await QnASession.findById(testQnASession._id)
        .exec()
        .catch((error) => {
            console.error(error);
            throw new Error('Retrieving QnA Session details');
        });

    expect(qnaSessionData.isActive).toBe(false);
    expect(qnaSessionData.dateTimeEnded).not.toBe(null);
});

test('ending existing qna with a few questions', async () => {
    for (let i = 0; i < 5; i++) {
        const randomString = Math.random().toString(36);
        await createQuestion(
            testQnASession._id,
            randomString,
            sampleUserName4,
            sampleQuestionContent
        );
    }

    await endQnASession(testQnASession._id);

    // get data
    const qnaSessionData: any = await QnASession.findById(testQnASession._id)
        .exec()
        .catch((error) => {
            console.error(error);
            throw new Error('Retrieving QnA Session details');
        });

    expect(qnaSessionData.isActive).toBe(false);
    expect(qnaSessionData.dateTimeEnded).not.toBe(null);
});

test('checking if current host is the host', async () => {
    const data = await isHost(testQnASession._id, testQnASession.hostId);
    expect(data).toEqual(true);
});

test('checking if random attendee is the host', async () => {
    const data = await isHost(testQnASession._id, sampleUserAADObjId3);
    expect(data).toEqual(false);
});

test('checking if active QnA is currently active', async () => {
    const data = await isActiveQnA(testQnASession._id);
    expect(data).toEqual(true);
});

test('checking if inactive QnA is currently active', async () => {
    const data = {
        title: sampleTitle,
        description: sampleDescription,
        userName: sampleUserName4,
        userAadObjId: sampleUserAADObjId4,
        activityId: sampleActivityId,
        tenantId: sampleTenantId,
        scopeId: sampleScopeId,
        isChannel: true,
    };

    const result = await createQnASession(
        data.title,
        data.description,
        data.userName,
        data.userAadObjId,
        data.activityId,
        data.tenantId,
        data.scopeId,
        data.isChannel
    );

    await endQnASession(result.qnaSessionId);

    const isActive = await isActiveQnA(result.qnaSessionId);
    expect(isActive).toEqual(false);
});
