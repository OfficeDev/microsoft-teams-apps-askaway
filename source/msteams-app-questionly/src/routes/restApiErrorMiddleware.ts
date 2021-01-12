import { NextFunction, Request, Response } from 'express';
import { UnauthorizedAccessError } from 'src/errors/unauthorizedAccessError';
import { ConversationDoesNotBelongToMeetingChatError } from 'src/errors/conversationDoesNotBelongToMeetingChatError';
import { ParameterMissingInRequestError } from 'src/errors/parameterMissingInRequestError';
import { UserIsNotPartOfConversationError } from 'src/errors/userIsNotPartOfConversationError';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { createResponseForBadRequest, createResponseForForbiddenAccess, createResponseForInternalServerError } from 'src/routes/responseUtility';
import { IUser } from 'msteams-app-questionly.data';
import { TelemetryExceptions } from 'src/constants/telemetryConstants';

/**
 * Error handling middleware for rest APIs
 * @param error - error thrown from Rest API flows.
 * @param request - request object.
 * @param response - response object.
 * @param next - next function.
 */
export const restApiErrorMiddleware = (error: Error, request: Request, response: Response, next: NextFunction) => {
    // More details will be logged as part of server side telemetry story.
    const user = <IUser>request.user;
    exceptionLogger(error, {
        httpMethod: request?.method,
        apiPath: request?.path,
        conversationId: request?.params?.conversationId,
        qnaSessionId: request?.params?.sessionId,
        questionId: request?.params?.questionId,
        userAadObjectId: user?._id,
        filename: module.id,
        exceptionName: TelemetryExceptions.RestApiCallFailed,
    });

    if (error instanceof UnauthorizedAccessError || error instanceof ConversationDoesNotBelongToMeetingChatError || error instanceof UserIsNotPartOfConversationError) {
        createResponseForForbiddenAccess(response, error.message);
    } else if (error instanceof ParameterMissingInRequestError) {
        createResponseForBadRequest(response, error.message);
    } else {
        createResponseForInternalServerError(response, error.message);
    }

    next(error);
};
