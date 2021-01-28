import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ConversationDoesNotBelongToMeetingChatError } from 'src/errors/conversationDoesNotBelongToMeetingChatError';
import { errorMessages } from 'src/errors/errorMessages';
import { UnauthorizedAccessError, UnauthorizedAccessErrorCode } from 'src/errors/unauthorizedAccessError';
import { ParameterMissingInRequestError } from 'src/errors/parameterMissingInRequestError';
import { UserIsNotPartOfConversationError } from 'src/errors/userIsNotPartOfConversationError';
import { restApiErrorMiddleware } from 'src/routes/restApiErrorMiddleware';

// tslint:disable-next-line
const request = {
    path: '/api/conversations',
} as Request;

// tslint:disable-next-line
const response = {
    statusCode: 200,
} as Response;

const next = jest.fn();

beforeAll(() => {
    response.send = jest.fn();
    (<any>response).send.mockImplementation((statusMessage?: any) => {
        response.statusMessage = JSON.stringify(statusMessage);
        return response;
    });

    response.status = jest.fn();
    (<any>response).status.mockImplementation((code: number) => {
        response.statusCode = code;
        return response;
    });
});

beforeEach(() => {
    jest.clearAllMocks();
});

test('restApiErrorMiddleware - handle InsufficientPermissionsToCreateOrEndQnASessionError', async () => {
    const error = new UnauthorizedAccessError(UnauthorizedAccessErrorCode.InsufficientPermissionsToCreateOrEndQnASession);
    restApiErrorMiddleware(error, request, response, next);

    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(error);
    expect(response.statusCode).toEqual(StatusCodes.FORBIDDEN);
    expect(JSON.parse(response.statusMessage).message).toEqual(errorMessages.InsufficientPermissionsToCreateOrEndQnASessionErrorMessage);
});

test('restApiErrorMiddleware - handle InsufficientPermissionsToMarkQuestionAsAnsweredError', async () => {
    const error = new UnauthorizedAccessError(UnauthorizedAccessErrorCode.InsufficientPermissionsToMarkQuestionAsAnswered);
    restApiErrorMiddleware(error, request, response, next);

    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(error);
    expect(response.statusCode).toEqual(StatusCodes.FORBIDDEN);
    expect(JSON.parse(response.statusMessage).message).toEqual(errorMessages.InsufficientPermissionsToMarkQuestionAsAnsweredErrorMessage);
});

test('restApiErrorMiddleware - handle ConversationDoesNotBelongToMeetingChatError', async () => {
    const error = new ConversationDoesNotBelongToMeetingChatError();
    restApiErrorMiddleware(error, request, response, next);

    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(error);
    expect(response.statusCode).toEqual(StatusCodes.FORBIDDEN);
    expect(JSON.parse(response.statusMessage).message).toEqual(errorMessages.ConversationDoesNotBelongToMeetingChatErrorMessage);
});

test('restApiErrorMiddleware - handle UserIsNotPartOfConversationError', async () => {
    const error = new UserIsNotPartOfConversationError();
    restApiErrorMiddleware(error, request, response, next);

    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(error);
    expect(response.statusCode).toEqual(StatusCodes.FORBIDDEN);
    expect(JSON.parse(response.statusMessage).message).toEqual(errorMessages.UserIsNotPartOfConversationErrorMessage);
});

test('restApiErrorMiddleware - handle ParameterMissingInRequestError', async () => {
    const testParamName = 'testParam';
    const error = new ParameterMissingInRequestError(testParamName);
    restApiErrorMiddleware(error, request, response, next);

    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(error);
    expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(response.statusMessage).message).toEqual(errorMessages.ParameterMissingInRequestErrorMessage.replace('{0}', testParamName));
});

test('restApiErrorMiddleware - handle generic error', async () => {
    const testErrorMessage = 'testErrorMessage';
    const error = new Error(testErrorMessage);
    request.params = {
        conversationId: 'sampleConversationId',
        sessionId: 'sampleSessionId',
        questionId: 'sampleQuestionId',
    };
    restApiErrorMiddleware(error, request, response, next);

    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(error);
    expect(response.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(response.statusMessage).message).toEqual(testErrorMessage);
});
