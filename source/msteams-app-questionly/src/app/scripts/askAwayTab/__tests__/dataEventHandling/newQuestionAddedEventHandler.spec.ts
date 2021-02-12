// tslint:disable:no-relative-imports
import { NewQuestionAddedEventHandler } from '../../dataEventHandling/newQuestionAddedEventHandler';
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import { IDataEvent } from 'msteams-app-questionly.common';

describe('validates NewQuestionAddedEventHandler', () => {
    let newQuestionAddedEventHandler;
    let mockUpdateQnASessionContent;
    let mockShowNewUpdatesButton;
    let mockUpdateActiveSessionData;
    const testsessionId = 'testsessionId';
    let testEventData: IDataEvent;
    let activeSessionData: ClientDataContract.QnaSession;

    beforeAll(() => {
        newQuestionAddedEventHandler = new NewQuestionAddedEventHandler();
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
            description: 'testDescription1',
            isActive: true,
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
        newQuestionAddedEventHandler.handleEvent(testEventData, null, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(1);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('event does not correspond to current active session data', async () => {
        activeSessionData.sessionId = 'random';

        newQuestionAddedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(1);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('event corresponds to first question', async () => {
        newQuestionAddedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

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
                votesCount: 0,
                voterAadObjectIds: [],
                author: { id: '', name: '' },
                isAnswered: false,
                dateTimeCreated: new Date(),
            },
        ];

        testEventData.data = { questionId: 'test' };

        newQuestionAddedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('content is not up to date with question', async () => {
        activeSessionData.unansweredQuestions = [
            {
                id: 'test1',
                content: '',
                sessionId: activeSessionData.sessionId,
                votesCount: 0,
                voterAadObjectIds: [],
                author: { id: '', name: '' },
                isAnswered: false,
                dateTimeCreated: new Date(),
            },
        ];

        testEventData.data = { questionId: 'test' };

        newQuestionAddedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(1);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });
});
