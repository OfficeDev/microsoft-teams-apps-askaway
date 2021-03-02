import { IDataEvent } from 'msteams-app-questionly.common';
import { ClientDataContract } from '../../../../contracts/clientDataContract';

/**
 * Interface for data event handler.
 */
export interface IDataEventHandler {
    handleEvent: (
        dataEvent: IDataEvent,
        activeSessionData: ClientDataContract.QnaSession | null,
        updateQnASessionContent: () => void,
        showNewUpdatesButton: () => void,
        updateActiveSessionData: (sessionData: ClientDataContract.QnaSession | null) => void
    ) => void;
}
