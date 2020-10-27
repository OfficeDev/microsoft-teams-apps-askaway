import mongoose from 'mongoose';
import { IQnASession, QnASession } from 'src/data/schemas/qnASession';
import { IQuestion, Question } from 'src/data/schemas/question';
import { IUser, User } from 'src/data/schemas/user';
import { questionDataService } from 'src/data/services/questionDataService';
import { userDataService } from 'src/data/services/userDataService';
import { getAllQnASesssionsDataForTab } from 'src/routes/restUtils';

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
        await createQuestionData();
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

    it('validates get all qna session data for tab', async () => {
        const result = await getAllQnASesssionsDataForTab(sampleConversationId);
        expect(result.length).toEqual(1);
        expect(result[0].title).toEqual(sampleTitle);
        expect(result[0].isActive).toEqual(true);
        expect(result[0].hostUser.id).toEqual(testUserId);
        expect(result[0].hostUser.name).toEqual(testUserName);
        expect(result[0].numberOfQuestions).toEqual(2);
    });

    it('validates get all qna session data for tab for invalid conversation id', async () => {
        const result = await getAllQnASesssionsDataForTab('1');
        expect(result.length).toEqual(0);
    });

    it('validates get all qna session data for tab - error while getting user data', async () => {
        (<any>userDataService.getUser) = jest.fn();
        (<any>userDataService.getUser).mockImplementationOnce(() => {
            throw new Error();
        });

        await getAllQnASesssionsDataForTab(sampleConversationId).catch(
            (err) => {
                expect(err).toEqual(new Error());
            }
        );
    });

    it('validates get all qna session data for tab - error while getting question data', async () => {
        (<any>questionDataService.getQuestionData) = jest.fn();
        (<any>questionDataService.getQuestionData).mockImplementationOnce(
            () => {
                throw new Error();
            }
        );

        await getAllQnASesssionsDataForTab(sampleConversationId).catch(
            (err) => {
                expect(err).toEqual(new Error());
            }
        );
    });
});
