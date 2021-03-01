import { IDataEvent } from 'msteams-app-questionly.common';
import { IDataEventHandler } from './IDataEventHandler';
import { ClientDataContract } from '../../../../contracts/clientDataContract';

/**
 * Handler for new question added event.
 */
export class NewQuestionAddedEventHandler implements IDataEventHandler {
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
        if (dataEvent.qnaSessionId !== activeSessionData?.sessionId) {
            // If the event is not for the current state qna session, that means there is a possibility of
            // missing events, hence update the screen with latest qna session data.
            updateQnASessionContent();
        } else if (activeSessionData?.unansweredQuestions.length === 0) {
            // If it's the first question, we should update the screen without showing 'new updates' hint.
            updateQnASessionContent();
        } else if (!activeSessionData?.unansweredQuestions.find((question) => question.id === dataEvent.data.questionId)) {
            // Show 'new updates' option only if current screen is not up to date with this event.
            // The screen would be up to date with this event for the user who added the question from meeting pane.
            showNewUpdatesButton();
        }
    };
}
