// tslint:disable:no-relative-imports
import { ClientDataContract } from '../../../../../contracts/clientDataContract';
import { IDataEvent } from 'msteams-app-questionly.common';
import { QnaSessionCreatedEventHandler } from '../../dataEventHandling/qnaSessionCreatedEventHandler';

describe('validates QnaSessionCreatedEventHandler', () => {
    let qnaSessionCreatedEventHandler;
    let mockUpdateQnASessionContent;
    let mockShowNewUpdatesButton;
    let mockUpdateActiveSessionData;
    const testsessionId = 'testsessionId';
    let testEventData: IDataEvent;
    let activeSessionData: ClientDataContract.QnaSession;

    beforeAll(() => {
        qnaSessionCreatedEventHandler = new QnaSessionCreatedEventHandler();
        mockUpdateQnASessionContent = jest.fn();
        mockShowNewUpdatesButton = jest.fn();
        mockUpdateActiveSessionData = jest.fn();
    });

    beforeEach(() => {
        testEventData = {
            qnaSessionId: testsessionId,
            type: 'qnaSessionCreatedEvent',
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
        qnaSessionCreatedEventHandler.handleEvent(testEventData, null, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(1);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('event does not correspond to current active session data', async () => {
        activeSessionData.sessionId = 'random';

        qnaSessionCreatedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(1);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });

    it('event corresponds to current active session data', async () => {
        qnaSessionCreatedEventHandler.handleEvent(testEventData, activeSessionData, mockUpdateQnASessionContent, mockShowNewUpdatesButton, mockUpdateActiveSessionData);

        expect(mockUpdateQnASessionContent).toBeCalledTimes(0);
        expect(mockShowNewUpdatesButton).toBeCalledTimes(0);
        expect(mockUpdateActiveSessionData).toBeCalledTimes(0);
    });
});
