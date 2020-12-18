import { errorMessages } from 'src/errors/errorMessages';

/**
 * Error when the user is not part of conversation.
 */
export class UserIsNotPartOfConversationError extends Error {
    code: string;

    /**
     * Constructor that initializes the error code.
     */
    constructor() {
        super(errorMessages.UserIsNotPartOfConversationErrorMessage);
        this.code = 'UserIsNotPartOfConversationError';
    }
}
