import { generateUniqueId } from 'adaptivecards';
import {
    qnaSessionDataService,
    questionDataService,
    userDataService,
} from 'msteams-app-questionly.data';
import { getAllQnASesssionsDataForTab } from 'src/routes/restUtils';

const sampleConversationId = '1';
let testQnAData1: any;
let testQnAData2: any;
let question1: any;
let question2: any;
let user1: any;
let user2: any;

// Test cases will be improved as part of rest api TASK 1211744, this is a boilerplate code.
describe('test /conversations/:conversationId/sessions/:sessionId api', () => {
    beforeAll(() => {
        (<any>qnaSessionDataService.getAllQnASessionData) = jest.fn();
        (<any>questionDataService.getQuestions) = jest.fn();
        (<any>userDataService.getUser) = jest.fn();

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

        question1 = {
            qnaSessionId: testQnAData1.id,
            userId: { _id: testQnAData1.hostId, userName: generateUniqueId() },
            content: generateUniqueId(),
            voters: [],
        };

        question2 = {
            qnaSessionId: testQnAData1.id,
            userId: { _id: testQnAData2.hostId, userName: generateUniqueId() },
            content: generateUniqueId(),
            voters: [],
        };

        user1 = {
            id: testQnAData1.hostId,
            userName: question1.userId.userName,
        };

        user2 = {
            id: testQnAData2.hostId,
            userName: question2.userId.userName,
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('validates get all qna session data for tab', async () => {
        (<any>(
            qnaSessionDataService.getAllQnASessionData
        )).mockImplementationOnce(() => {
            return [testQnAData1, testQnAData2];
        });

        (<any>questionDataService.getQuestions).mockImplementation((qnaid) => {
            if (qnaid == testQnAData1.id) {
                return {
                    topQuestions: [question1, question2],
                    recentQuestions: [question1, question2],
                    numQuestions: 2,
                };
            } else if (qnaid == testQnAData2.id) {
                return {
                    topQuestions: [],
                    recentQuestions: [],
                    numQuestions: 0,
                };
            }
        });

        (<any>userDataService.getUser).mockImplementation((id) => {
            if (id == testQnAData1.hostId) {
                return user1;
            } else if (id == testQnAData2.hostId) {
                return user2;
            }
        });

        const result = await getAllQnASesssionsDataForTab(sampleConversationId);
        expect(result.length).toEqual(2);
        expect(result[0].title).toEqual(testQnAData1.title);
        expect(result[0].numberOfQuestions).toEqual(2);
        expect(result[0].isActive).toEqual(testQnAData1.isActive);
        expect(result[0].hostUser.id).toEqual(user1.id);
        expect(result[0].hostUser.name).toEqual(user1.userName);
        expect(result[0].users.length).toEqual(2);
        expect(result[0].users[0].name).toEqual(user1.userName);
        expect(result[0].users[1].name).toEqual(user2.userName);
        expect(result[0].users[0].id).toEqual(user1.id);
        expect(result[0].users[1].id).toEqual(user2.id);
        expect(result[1].title).toEqual(testQnAData2.title);
        expect(result[1].numberOfQuestions).toEqual(0);
        expect(result[1].isActive).toEqual(testQnAData2.isActive);
        expect(result[1].hostUser.id).toEqual(user2.id);
        expect(result[1].hostUser.name).toEqual(user2.userName);
        expect(result[1].users.length).toEqual(0);
        expect(qnaSessionDataService.getAllQnASessionData).toBeCalledTimes(1);
        expect(qnaSessionDataService.getAllQnASessionData).toBeCalledWith(
            sampleConversationId
        );
        expect(questionDataService.getQuestions).toBeCalledTimes(2);
        expect(userDataService.getUser).toBeCalledTimes(2);
    });

    it('validates get all qna session data for tab for invalid conversation id', async () => {
        (<any>(
            qnaSessionDataService.getAllQnASessionData
        )).mockImplementationOnce(() => {
            return [];
        });
        const result = await getAllQnASesssionsDataForTab(sampleConversationId);

        expect(result.length).toEqual(0);
        expect(qnaSessionDataService.getAllQnASessionData).toBeCalledTimes(1);
        expect(qnaSessionDataService.getAllQnASessionData).toBeCalledWith(
            sampleConversationId
        );
    });

    it('validates get all qna session data for tab - error while getting user data', async () => {
        const sampleError: Error = new Error();
        (<any>(
            qnaSessionDataService.getAllQnASessionData
        )).mockImplementationOnce(() => {
            return [testQnAData1, testQnAData2];
        });

        (<any>questionDataService.getQuestions).mockImplementation((qnaid) => {
            if (qnaid == testQnAData1.id) {
                return {
                    topQuestions: [question1, question2],
                    recentQuestions: [question1, question2],
                    numQuestions: 2,
                };
            } else if (qnaid == testQnAData2.id) {
                return {
                    topQuestions: [],
                    recentQuestions: [],
                    numQuestions: 0,
                };
            }
        });

        (<any>userDataService.getUser).mockImplementationOnce(() => {
            throw sampleError;
        });

        await getAllQnASesssionsDataForTab(sampleConversationId).catch(
            (err) => {
                expect(err).toEqual(new Error());
            }
        );

        expect(qnaSessionDataService.getAllQnASessionData).toBeCalledTimes(1);
        expect(qnaSessionDataService.getAllQnASessionData).toBeCalledWith(
            sampleConversationId
        );
        expect(questionDataService.getQuestions).toBeCalledTimes(1);
        expect(userDataService.getUser).toBeCalledTimes(1);
    });

    it('validates get all qna session data for tab - error while getting question data', async () => {
        const sampleError: Error = new Error();
        (<any>(
            qnaSessionDataService.getAllQnASessionData
        )).mockImplementationOnce(() => {
            return [testQnAData1, testQnAData2];
        });

        (<any>questionDataService.getQuestions).mockImplementationOnce(() => {
            throw sampleError;
        });

        await getAllQnASesssionsDataForTab(sampleConversationId).catch(
            (err) => {
                expect(err).toEqual(sampleError);
            }
        );

        expect(qnaSessionDataService.getAllQnASessionData).toBeCalledTimes(1);
        expect(qnaSessionDataService.getAllQnASessionData).toBeCalledWith(
            sampleConversationId
        );
        expect(questionDataService.getQuestions).toBeCalledTimes(1);
        expect(userDataService.getUser).toBeCalledTimes(0);
    });
});
