import { NextFunction, Request, Response } from 'express';
import { UnauthorizedAccessError } from 'src/errors/unauthorizedAccessError';
import { ConversationDoesNotBelongToMeetingChatError } from 'src/errors/conversationDoesNotBelongToMeetingChatError';
import { ParameterMissingInRequestError } from 'src/errors/parameterMissingInRequestError';
import { UserIsNotPartOfConversationError } from 'src/errors/userIsNotPartOfConversationError';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { createResponseForBadRequest, createResponseForForbiddenAccess, createResponseForInternalServerError } from 'src/routes/responseUtility';

/**
 * Error handling middleware for rest APIs
 * @param error - error thrown from Rest API flows.
 * @param request - request object.
 * @param response - response object.
 * @param next - next function.
 */
export const restApiErrorMiddleware = (error: Error, request: Request, response: Response, next: NextFunction) => {
    // More details will be logged as part of server side telemetry story.
    exceptionLogger(`Error occured in ${request.path}, error: ${error}`);

    if (error instanceof UnauthorizedAccessError || error instanceof ConversationDoesNotBelongToMeetingChatError || error instanceof UserIsNotPartOfConversationError) {
        createResponseForForbiddenAccess(response, error.message);
    } else if (error instanceof ParameterMissingInRequestError) {
        createResponseForBadRequest(response, error.message);
    } else {
        createResponseForInternalServerError(response, error.message);
    }

    next(error);
};
