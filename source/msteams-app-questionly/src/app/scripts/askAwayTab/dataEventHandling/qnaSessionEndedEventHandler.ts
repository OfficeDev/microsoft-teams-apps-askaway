// tslint:disable:no-relative-imports
import { IDataEvent } from 'msteams-app-questionly.common';
import { IDataEventHandler } from './IDataEventHandler';
import { ClientDataContract } from '../../../../contracts/clientDataContract';

/**
 * Handler for question ended event.
 */
export class QnaSessionEndedEventHandler implements IDataEventHandler {
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
        // If the event is for current state qna session data, update the screen with qna session ended state.
        if (activeSessionData?.sessionId === dataEvent.qnaSessionId) {
            updateActiveSessionData(null);
        } else if (activeSessionData !== null) {
            // If the event is not for the current state qna session, that means there is a possibility of
            // missing events, hence update the screen with latest qna session data.
            updateQnASessionContent();
        }
    };
}
