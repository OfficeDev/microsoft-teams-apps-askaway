import { errorMessages } from 'src/errors/errorMessages';

/**
 * Error when conversation does not belong to meeting chat.
 */
export class ConversationDoesNotBelongToMeetingChatError extends Error {
    code: string;

    /**
     * Constructor that initializes the error code.
     */
    constructor() {
        super(errorMessages.ConversationDoesNotBelongToMeetingChatErrorMessage);
        this.code = 'ConversationDoesNotBelongToMeetingChatError';
    }
}
