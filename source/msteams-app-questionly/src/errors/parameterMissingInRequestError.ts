import { errorMessages } from 'src/errors/errorMessages';

/**
 * Error when the user is not part of conversation.
 */
export class ParameterMissingInRequestError extends Error {
    code: string;

    /**
     * Constructor that initializes the error code.
     */
    constructor(parameterName: string) {
        super(errorMessages.ParameterMissingInRequestErrorMessage.replace('{0}', parameterName));
        this.code = 'ParameterMissingInRequestError';
    }
}
