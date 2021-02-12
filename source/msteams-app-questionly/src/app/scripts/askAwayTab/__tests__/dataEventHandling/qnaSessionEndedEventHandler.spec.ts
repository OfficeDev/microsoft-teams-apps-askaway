// tslint:disable:no-relative-imports
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import { IDataEvent } from 'msteams-app-questionly.common';
import { QnaSessionEndedEventHandler } from '../../dataEventHandling/qnaSessionEndedEventHandler';

describe('validates QnaSessionEndedEventHandler', () => {
    let qnaSessionEndedEventHandler;
    let mockUpdateQnASessionContent;
    let mockShowNewUpdatesButton;
    let mockUpdateActiveSessionData;
    const testsessionId = 'testsessionId';
    let testEventData: IDataEvent;
    let activeSessionData: ClientDataContract.QnaSession;

    beforeAll(() => {
        qnaSessionEndedEventHandler = new QnaSessionEndedEventHandler();
        mockUpdateQnASessionContent = jest.fn();
        mockShowNewUpdatesButton = jest.fn();
        mockUpdateActiveSessionData = jest.fn();
    });

    beforeEach(() => {
        testEventData = {
            qnaSessionId: testsessionId,
            type: 'qnaSessionCreatedEvent',
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
        qnaSessionEndedEventHandler.handleEvent(testEventData, null, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('event does not correspond to current active session data', async () => {
        activeSessionData.sessionId = 'random';

        qnaSessionEndedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(1);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('event corresponds to current active session data', async () => {
        qnaSessionEndedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(1);
    });
});
