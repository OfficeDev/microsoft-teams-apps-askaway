import { DataEventType, IDataEvent } from "msteams-app-questionly.common";

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
 * @param token - Bearer token in received in request.
 */
export const isValidToken = (token: string): Boolean => {
  if (process.env.debugMode === "true") {
    return true;
  }

  if (!isValidParam(token) || !token.startsWith("Bearer")) {
    return false;
  }
  token = token.replace("Bearer", "").trim();
  const base64Payload = token.split(".")[1];
  const payload = JSON.parse(Buffer.from(base64Payload, "base64").toString());

  if (payload.oid !== process.env.IdentityObjectId_AppService) {
    return false;
  }
  return true;
};
