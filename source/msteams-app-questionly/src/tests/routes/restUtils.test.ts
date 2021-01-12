import { generateUniqueId } from 'adaptivecards';
import { BotFrameworkAdapter } from 'botbuilder';
import { questionDataService, userDataService, IConversation } from 'msteams-app-questionly.data';
import { getTeamsUserId, getMemberInfo, getAndEnsureRequestBodyContainsParameter, ensureUserIsPartOfMeetingConversation } from 'src/routes/restUtils';
import { getMicrosoftAppPassword } from 'src/util/keyvault';
import { Request } from 'express';
import { ParameterMissingInRequestError } from 'src/errors/parameterMissingInRequestError';
import { errorMessages } from 'src/errors/errorMessages';
import { ConversationDoesNotBelongToMeetingChatError } from 'src/errors/conversationDoesNotBelongToMeetingChatError';
import { verifyUserFromConversationId } from 'msteams-app-questionly.common';
import { UserIsNotPartOfConversationError } from 'src/errors/userIsNotPartOfConversationError';
import { formatQnaSessionDataArrayAsPerClientDataContract } from 'src/util/clientDataContractFormatter';

const sampleUserId = 'sampleUserId';
const sampleServiceUrl = 'sampleServiceUrl';
const sampleConversationId = 'sampleConversationId';
let testQnAData1: any;
let testQnAData2: any;
let question1: any;
let question2: any;
let user1: any;
let user2: any;

// Test cases will be improved as part of rest api TASK 1211744, this is a boilerplate code.
describe('test process QnA sesssions for meeting tab', () => {
    beforeAll(() => {
        (<any>questionDataService.getQuestionData) = jest.fn();
        (<any>userDataService.getUser) = jest.fn();

        testQnAData1 = {
            _id: generateUniqueId(),
            hostId: generateUniqueId(),
            hostUserId: generateUniqueId(),
            title: generateUniqueId(),
            description: generateUniqueId(),
            conversationId: generateUniqueId(),
            tenantId: generateUniqueId(),
            isActive: true,
        };

        testQnAData2 = {
            _id: generateUniqueId(),
            hostId: generateUniqueId(),
            hostUserId: generateUniqueId(),
            title: generateUniqueId(),
            description: generateUniqueId(),
            conversationId: generateUniqueId(),
            tenantId: generateUniqueId(),
            isActive: true,
        };

        question1 = {
            qnaSessionId: testQnAData1._id,
            userId: { _id: testQnAData1.hostId, userName: generateUniqueId() },
            content: generateUniqueId(),
            voters: [generateUniqueId(), generateUniqueId()],
            isAnswered: true,
        };

        question2 = {
            qnaSessionId: testQnAData1._id,
            userId: { _id: testQnAData2.hostId, userName: generateUniqueId() },
            content: generateUniqueId(),
            voters: [generateUniqueId(), generateUniqueId()],
            isAnswered: false,
        };

        user1 = {
            _id: testQnAData1.hostId,
            userName: question1.userId.userName,
        };

        user2 = {
            _id: testQnAData2.hostId,
            userName: question2.userId.userName,
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('validates process QnA sesssions for meeting tab', async () => {
        const qnaSessionsData = [testQnAData1, testQnAData2];
        (<any>questionDataService.getQuestionData).mockImplementation((qnaid) => {
            if (qnaid === testQnAData1._id) {
                return [question1, question2];
            } else if (qnaid === testQnAData2._id) {
                return [];
            }
        });
        (<any>userDataService.getUser).mockImplementation((id) => {
            if (id == testQnAData1.hostId) {
                return user1;
            } else if (id == testQnAData2.hostId) {
                return user2;
            }
        });
        const result = await formatQnaSessionDataArrayAsPerClientDataContract(qnaSessionsData);
        expect(result.length).toEqual(2);
        expect(result[0].title).toEqual(testQnAData1.title);
        expect(result[0].isActive).toEqual(testQnAData1.isActive);
        expect(result[0].hostUser.id).toEqual(user1._id);
        expect(result[0].hostUser.name).toEqual(user1.userName);
        expect(result[0].unansweredQuestions?.[0].content).toEqual(question2.content);
        expect(result[0].answeredQuestions?.[0].content).toEqual(question1.content);
        expect(result[1].title).toEqual(testQnAData2.title);
        expect(result[1].isActive).toEqual(testQnAData2.isActive);
        expect(result[1].hostUser.id).toEqual(user2._id);
        expect(result[1].hostUser.name).toEqual(user2.userName);
        expect(questionDataService.getQuestionData).toBeCalledTimes(2);
        expect(userDataService.getUser).toBeCalledTimes(2);
    });

    it('validates process QnA sesssions for meeting tab - no qna session data', async () => {
        const qnaSessionsData = [];
        const result = await formatQnaSessionDataArrayAsPerClientDataContract(qnaSessionsData);

        expect(result.length).toEqual(0);
    });

    it('validates process QnA sesssions for meeting tab - error while getting user data', async () => {
        const sampleError: Error = new Error();
        (<any>questionDataService.getQuestionData).mockImplementation((qnaid) => {
            if (qnaid === testQnAData1._id) {
                return [question1, question2];
            } else if (qnaid === testQnAData2._id) {
                return [];
            }
        });
        (<any>userDataService.getUser).mockImplementationOnce(() => {
            throw sampleError;
        });

        const qnaSessionsData = [testQnAData1, testQnAData2];
        await formatQnaSessionDataArrayAsPerClientDataContract(qnaSessionsData).catch((err) => {
            expect(err).toEqual(sampleError);
        });
        expect(questionDataService.getQuestionData).toBeCalled();
        expect(userDataService.getUser).toBeCalled();
    });

    it('validates process QnA sesssions for meeting tab - error while getting question data', async () => {
        const sampleError: Error = new Error();
        (<any>questionDataService.getQuestionData).mockImplementationOnce(() => {
            throw sampleError;
        });
        const qnaSessionsData = [testQnAData1, testQnAData2];
        await formatQnaSessionDataArrayAsPerClientDataContract(qnaSessionsData).catch((err) => {
            expect(err).toEqual(sampleError);
        });
        expect(questionDataService.getQuestionData).toBeCalled();
    });
});

describe('test getHostUserId', () => {
    beforeAll(() => {
        process.env.MicrosoftAppId = 'random';
        (<any>BotFrameworkAdapter) = jest.fn();
        (<any>getMemberInfo) = jest.fn();
        (<any>getMicrosoftAppPassword) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('validate getHostUserId', async () => {
        const sampleId = '1';
        (<any>getMicrosoftAppPassword).mockImplementationOnce(() => {
            return 'random';
        });
        (<any>getMemberInfo).mockImplementationOnce(() => {
            return {
                id: sampleId,
            };
        });
        const result = await getTeamsUserId(sampleUserId, sampleConversationId, sampleServiceUrl);

        expect(result).toBeTruthy();
        expect(result).toEqual(sampleId);
        expect(getMemberInfo).toBeCalledTimes(1);
    });

    it('validate getHostUserId - get member info fails', async () => {
        (<any>getMicrosoftAppPassword).mockImplementationOnce(() => {
            return 'random';
        });
        (<any>getMemberInfo).mockImplementationOnce(() => {
            return undefined;
        });

        await getTeamsUserId(sampleUserId, sampleConversationId, sampleServiceUrl).catch((err) => {
            expect(err).toEqual(new Error('Could not get member info for teams user'));
        });
    });
});

describe('tests getAndEnsureRequestBodyContainsParameter', () => {
    // tslint:disable-next-line
    const request = {
        path: '/api/conversations',
    } as Request;

    it('parameter not present in request body', async () => {
        request.body = {};
        const testParamName = 'testParamName';

        try {
            getAndEnsureRequestBodyContainsParameter(request, testParamName);
        } catch (error) {
            expect(error instanceof ParameterMissingInRequestError);
            expect(error.message).toEqual(errorMessages.ParameterMissingInRequestErrorMessage.replace('{0}', testParamName));
        }
    });

    it('parameter is null in request body', async () => {
        const testParamName = 'testParamName';

        request.body = {
            testParamName: null,
        };

        try {
            getAndEnsureRequestBodyContainsParameter(request, testParamName);
        } catch (error) {
            expect(error instanceof ParameterMissingInRequestError);
            expect(error.message).toEqual(errorMessages.ParameterMissingInRequestErrorMessage.replace('{0}', testParamName));
        }
    });

    it('parameter is empty string in request body', async () => {
        const testParamName = 'testParamName';

        request.body = {
            testParamName: '',
        };

        try {
            getAndEnsureRequestBodyContainsParameter(request, testParamName);
        } catch (error) {
            expect(error instanceof ParameterMissingInRequestError);
            expect(error.message).toEqual(errorMessages.ParameterMissingInRequestErrorMessage.replace('{0}', testParamName));
        }
    });

    it('valid parameter is present in request body', async () => {
        const testParamName = 'testParamName';

        request.body = {
            testParamName: 'test',
        };

        expect(getAndEnsureRequestBodyContainsParameter(request, testParamName)).toEqual('test');
    });
});

describe('tests ensureUserIsPartOfMeetingConversation', () => {
    beforeAll(() => {
        process.env.MicrosoftAppId = 'random';
        (<any>getMicrosoftAppPassword) = jest.fn();
        (<any>verifyUserFromConversationId) = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('conversation not part of meeting', async () => {
        // tslint:disable-next-line
        const conversationData = {
            id: 'test',
            serviceUrl: 'testserviceUrl',
            tenantId: 'testTenant',
        } as IConversation;

        try {
            await ensureUserIsPartOfMeetingConversation(conversationData, 'testUserId');
        } catch (error) {
            expect(error instanceof ConversationDoesNotBelongToMeetingChatError);
            expect(error.message).toEqual(errorMessages.ConversationDoesNotBelongToMeetingChatErrorMessage);
        }

        expect(<any>getMicrosoftAppPassword).toBeCalledTimes(0);
        expect(<any>verifyUserFromConversationId).toBeCalledTimes(0);
    });

    it('user is not part of conversation', async () => {
        // tslint:disable-next-line
        const conversationData = {
            id: 'test',
            serviceUrl: 'testserviceUrl',
            tenantId: 'testTenant',
            meetingId: 'testMeetingId',
        } as IConversation;

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return false;
        });

        try {
            await ensureUserIsPartOfMeetingConversation(conversationData, 'testUserId');
        } catch (error) {
            expect(error instanceof UserIsNotPartOfConversationError);
            expect(error.message).toEqual(errorMessages.UserIsNotPartOfConversationErrorMessage);
        }

        expect(<any>getMicrosoftAppPassword).toBeCalledTimes(1);
        expect(<any>verifyUserFromConversationId).toBeCalledTimes(1);
    });

    it('user is part of meeting conversation', async () => {
        // tslint:disable-next-line
        const conversationData = {
            id: 'test',
            serviceUrl: 'testserviceUrl',
            tenantId: 'testTenant',
            meetingId: 'testMeetingId',
        } as IConversation;

        (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
            return true;
        });

        await ensureUserIsPartOfMeetingConversation(conversationData, 'testUserId');

        expect(<any>getMicrosoftAppPassword).toBeCalledTimes(1);
        expect(<any>verifyUserFromConversationId).toBeCalledTimes(1);
    });
});
