import { errorMessages } from 'src/errors/errorMessages';

/**
 * Error when there is a failure in trigerring background job and changes are reverted.
 */
export class ChangesRevertedDueToBackgroundJobFailureError extends Error {
    public static code = 'ChangesRevertedDueToBackgroundJobFailureError';

    /**
     * Constructor that initializes the error message.
     */
    constructor() {
        super(errorMessages.ChangesRevertedDueToBackgroundJobFailureErrorMessage);
    }
}
