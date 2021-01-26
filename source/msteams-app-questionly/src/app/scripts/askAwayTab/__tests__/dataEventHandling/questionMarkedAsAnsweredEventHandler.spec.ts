// tslint:disable:no-relative-imports
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import { IDataEvent } from 'msteams-app-questionly.common';
import { QuestionMarkedAsAnsweredEventHandler } from '../../dataEventHandling/questionMarkedAsAnsweredEventHandler';

describe('validates QuestionMarkedAsAnsweredEventHandler', () => {
    let questionMarkedAsAnsweredEventHandler;
    let mockUpdateQnASessionContent;
    let mockShowNewUpdatesButton;
    let mockUpdateActiveSessionData;
    const testsessionId = 'testsessionId';
    let testEventData: IDataEvent;
    let activeSessionData: ClientDataContract.QnaSession;

    beforeAll(() => {
        questionMarkedAsAnsweredEventHandler = new QuestionMarkedAsAnsweredEventHandler();
        mockUpdateQnASessionContent = jest.fn();
        mockShowNewUpdatesButton = jest.fn();
        mockUpdateActiveSessionData = jest.fn();
    });

    beforeEach(() => {
        testEventData = {
            qnaSessionId: testsessionId,
            type: 'newQuestionAddedEvent',
            data: {},
            version: 0,
        };

        activeSessionData = {
            sessionId: testsessionId,
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
        questionMarkedAsAnsweredEventHandler.handleEvent(testEventData, null, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(1);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('event does not correspond to current active session data', async () => {
        activeSessionData.sessionId = 'random';

        questionMarkedAsAnsweredEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(1);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('content is already up to date with question', async () => {
        activeSessionData.answeredQuestions = [
            {
                id: 'test',
                content: '',
                sessionId: activeSessionData.sessionId,
                votesCount: 1,
                author: { id: '', name: '' },
                isAnswered: true,
                dateTimeCreated: new Date(),
                voterAadObjectIds: ['testUser'],
            },
        ];

        testEventData.data = { questionId: 'test' };

        questionMarkedAsAnsweredEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('content is not up to date with question', async () => {
        testEventData.data = { questionId: 'test' };

        questionMarkedAsAnsweredEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(1);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });
});
