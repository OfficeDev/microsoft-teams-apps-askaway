import { IDataEvent } from 'msteams-app-questionly.common';
import { IDataEventHandler } from './IDataEventHandler';
import { ClientDataContract } from '../../../../contracts/clientDataContract';

/**
 * Handler for question downvoted event.
 */
export class QuestionDownvotedEventHandler implements IDataEventHandler {
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
        const downvotedByUserAadObjectId: string = dataEvent.data.downvotedByUserAadObjectId;

        if (activeSessionData?.sessionId !== dataEvent.qnaSessionId) {
            // If the event is not for the current state qna session, that means there is a possibility of
            // missing events, hence update the screen with latest qna session data.
            updateQnASessionContent();
        }
        // Show new updates hint only if current screen is not up to date with this event.
        else {
            const questionId = dataEvent.data.questionId;

            // find question corresponding to event.
            const question =
                activeSessionData?.answeredQuestions.find((question) => question.id === questionId) || activeSessionData?.unansweredQuestions.find((question) => question.id === questionId);

            if (!question || question.voterAadObjectIds.includes(downvotedByUserAadObjectId)) {
                showNewUpdatesButton();
            }
        }
    };
}
