import { errorMessages } from './errorMessages';

export enum UnauthorizedAccessErrorCode {
    InsufficientPermissionsToCreateOrEndQnASession = 'InsufficientPermissionsToCreateOrEndQnASession',
    InsufficientPermissionsToMarkQuestionAsAnswered = 'InsufficientPermissionsToMarkQuestionAsAnswered',
}

/**
 * Error when the user does not have sufficient permissions to create or end QnA session.
 */
export class UnauthorizedAccessError extends Error {
    code: UnauthorizedAccessErrorCode;

    /**
     * Constructor that initializes the error code.
     */
    constructor(code: UnauthorizedAccessErrorCode) {
        let errorMessage = '';

        switch (code) {
            case UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession: {
                errorMessage = errorMessages.InsufficientPermissionsToCreateOrEndQnASessionErrorMessage;
                break;
            }
            case UnauthorizedAccessErrorCode.InsufficientPermissionsToMarkQuestionAsAnswered: {
                errorMessage = errorMessages.InsufficientPermissionsToMarkQuestionAsAnsweredErrorMessage;
                break;
            }
            default: {
                throw new Error(`code ${code} is not supported for UnauthorizedAccessError.`);
            }
        }

        super(errorMessage);

        this.code = code;
    }
}
