/**
 * Error when the user does not have sufficient permissions to create or end QnA session.
 */
export class InsufficientPermissionsToCreateOrEndQnASessionError extends Error {
    code: string;

    /**
     * Constructor that initializes the error code.
     * @param message error message.
     */
    constructor(message: string) {
        super(message);
        this.code = 'InsufficientPermissionsToCreateOrEndQnASessionError';
    }
}
