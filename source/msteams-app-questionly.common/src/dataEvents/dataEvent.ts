// Data event types.
export const DataEventType = {
  qnaSessionCreatedEvent: "qnaSessionCreatedEvent",
  qnaSessionEndedEvent: "qnaSessionEndedEvent",
  newQuestionAddedEvent: "newQuestionAddedEvent",
  questionUpvotedEvent: "questionUpvotedEvent",
  questionDownvotedEvent: "questionDownvotedEvent",
  questionMarkedAsAnsweredEvent: "questionMarkedAsAnsweredEvent",
};

// Data event sent to clients to update UX realtime.
export interface IDataEvent {
  qnaSessionId: string;
  type: string;
  data: any;
}
