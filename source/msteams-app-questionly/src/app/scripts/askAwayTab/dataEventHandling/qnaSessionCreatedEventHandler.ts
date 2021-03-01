import { IDataEvent } from 'msteams-app-questionly.common';
import { ClientDataContract } from '../../../../contracts/clientDataContract';
import { IDataEventHandler } from './IDataEventHandler';

/**
 * Handler for new session created event.
 */
export class QnaSessionCreatedEventHandler implements IDataEventHandler {
    /**
     * Handles event
     * @param dataEvent - data event.
     * @param activeSessionData - current state qna session data.
     * @param updateQnASessionContent - callback function from caller, which updates qna session content.
     * @param showNewUpdatesButton - callback function from caller, which shows new updates hint.
     * @param updateActiveSessionData - callback function from caller, which updates active qna session data in state.
     */
    public handleEvent = (
        dataEvent: IDataEvent,
        activeSessionData: ClientDataContract.QnaSession | null,
        updateQnASessionContent: () => void,
        showNewUpdatesButton: () => void,
        updateActiveSessionData: (sessionData: ClientDataContract.QnaSession | null) => void
    ) => {
        // No need to update screen if event corresponds to current state `activeSessionData`.
        // Otherwise update screen with latest qna session data.
        if (dataEvent.qnaSessionId !== activeSessionData?.sessionId) {
            updateQnASessionContent();
        }
    };
}
