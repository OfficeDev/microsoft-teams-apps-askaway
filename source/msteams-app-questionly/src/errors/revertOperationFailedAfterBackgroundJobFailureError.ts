/**
 * Error when there is a failure reverting DB changes after background job trigger is unsuccessful.
 */
export class RevertOperationFailedAfterBackgroundJobFailureError extends Error {
    public code = 'RevertOperationFailedAfterBackgroundJobFailureError';

    /**
     * Constructor that initializes the error message.
     */
    constructor(message: string) {
        super(message);
    }
}
