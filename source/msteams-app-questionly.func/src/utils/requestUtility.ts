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
