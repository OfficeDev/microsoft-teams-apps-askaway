import { IDataEvent } from 'msteams-app-questionly.common';
import { ClientDataContract } from '../../../../contracts/clientDataContract';
import { IDataEventHandler } from './IDataEventHandler';

/**
 * Handler for question marked as answered event.
 */
export class QuestionMarkedAsAnsweredEventHandler implements IDataEventHandler {
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
        if (activeSessionData?.sessionId !== dataEvent.qnaSessionId) {
            // If the event is not for the current state qna session, that means there is a possibility of
            // missing events, hence update the screen with latest qna session data.
            updateQnASessionContent();
        } else if (!activeSessionData?.answeredQuestions.find((question) => question.id === dataEvent.data.questionId)) {
            showNewUpdatesButton();
        }
    };
}
