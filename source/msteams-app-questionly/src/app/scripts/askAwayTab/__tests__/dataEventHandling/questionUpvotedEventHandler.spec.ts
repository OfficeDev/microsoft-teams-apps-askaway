import { IDataEvent } from 'msteams-app-questionly.common';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import { QuestionUpvotedEventHandler } from '../../dataEventHandling/questionUpvotedEventHandler';

describe('validates QuestionUpvotedEventHandler', () => {
    let questionUpvotedEventHandler;
    let mockUpdateQnASessionContent;
    let mockShowNewUpdatesButton;
    let mockUpdateActiveSessionData;
    const testsessionId = 'testsessionId';
    let testEventData: IDataEvent;
    let activeSessionData: ClientDataContract.QnaSession;

    beforeAll(() => {
        questionUpvotedEventHandler = new QuestionUpvotedEventHandler();
        mockUpdateQnASessionContent = jest.fn();
        mockShowNewUpdatesButton = jest.fn();
        mockUpdateActiveSessionData = jest.fn();
    });

    beforeEach(() => {
        testEventData = {
            qnaSessionId: testsessionId,
            type: 'newQuestionAddedEvent',
            data: {},
        };

        activeSessionData = {
            sessionId: testsessionId,
            isActive: true,
            description: 'testDescription1',
            title: '',
            answeredQuestions: [],
            unansweredQuestions: [],
            hostUser: { id: '', name: '' },
            dateTimeCreated: new Date(),
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('current active session data is null', async () => {
        questionUpvotedEventHandler.handleEvent(testEventData, null, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(1);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('event does not correspond to current active session data', async () => {
        activeSessionData.sessionId = 'random';

        questionUpvotedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(1);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('content is already up to date with question', async () => {
        activeSessionData.unansweredQuestions = [
            {
                id: 'test',
                content: '',
                sessionId: activeSessionData.sessionId,
                votesCount: 1,
                author: { id: '', name: '' },
                isAnswered: false,
                dateTimeCreated: new Date(),
                voterAadObjectIds: ['testUser'],
            },
        ];

        testEventData.data = {
            questionId: 'test',
            upvotedByUserAadObjectId: 'testUser',
        };

        questionUpvotedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('content is not up to date with question - question is not upvoted', async () => {
        activeSessionData.unansweredQuestions = [
            {
                id: 'test',
                content: '',
                sessionId: activeSessionData.sessionId,
                votesCount: 0,
                voterAadObjectIds: [],
                author: { id: '', name: '' },
                isAnswered: false,
                dateTimeCreated: new Date(),
            },
        ];

        testEventData.data = {
            questionId: 'test',
            upvotedByUserAadObjectId: 'testUser',
        };

        questionUpvotedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(1);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('content is not up to date with question - question not found', async () => {
        testEventData.data = {
            questionId: 'test',
            upvotedByUserAadObjectId: 'testUser',
        };

        questionUpvotedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(1);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });
});
