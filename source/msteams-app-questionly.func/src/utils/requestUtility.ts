import { Context, HttpRequest } from "@azure/functions";
import { DataEventType, IDataEvent } from "msteams-app-questionly.common";
import { userIdParameterConstant } from "../constants/requestConstants";
import { authenticateRequest } from "../services/authService";

/**
 * Checks if parameter is defined.
 * @param param:  request param.
 * @returns - true if parameter is valid.
 */
export const isValidParam = (param: any): boolean => {
  return param !== undefined && param !== null;
};

/**
 * Returns true if dataEvent indicates qnasession started/ended event.
 * @param dataEvent - dataEvent
 * @returns - true if eventData corresponds to qnasession started/ended event.
 */
export const isQnaStartedOrEndedEvent = (dataEvent: IDataEvent): Boolean => {
  return (
    isValidParam(dataEvent) &&
    (dataEvent.type === DataEventType.qnaSessionCreatedEvent ||
      dataEvent.type === DataEventType.qnaSessionEndedEvent)
  );
};

/**
 * Checks if dataEvent is for question related event and if card refreh is required
 * @param dataEvent - dataEvent
 * @returns true card refresh is required.
 */
export const isCardRefreshNeededForQuestionEvent = (
  dataEvent: IDataEvent
): Boolean => {
  return (
    isValidParam(dataEvent) &&
    // Adaptive card does not need refresh for question marked as answered event.
    (dataEvent.type === DataEventType.questionDownvotedEvent ||
      dataEvent.type === DataEventType.questionUpvotedEvent ||
      dataEvent.type === DataEventType.newQuestionAddedEvent)
  );
};

/**
 * Checks if the token is valid, and oid received in token payload is equal to object id for managed identity in app service.
 * @param context - context
 * @param req - http request
 */
export const validateTokenFromAppService = async (
  context: Context,
  req: HttpRequest
): Promise<Boolean> => {
  if (process.env.debugMode) {
    return true;
  }
  const isAuthenticRequest = await authenticateRequest(context, req);
  return (
    isAuthenticRequest &&
    req[userIdParameterConstant] === process.env.IdentityObjectId_AppService
  );
};
