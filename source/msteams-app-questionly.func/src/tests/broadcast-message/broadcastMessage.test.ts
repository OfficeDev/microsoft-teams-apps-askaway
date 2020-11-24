import httpFunction from "./../../../broadcast-message/index";
import { activityMockContext } from "../mocks/testContext";

let request: any;
let sampleContext: any;

beforeEach(() => {
  jest.clearAllMocks();
  request = {
    body: {
      context: sampleContext,
    },
    headers: null,
  };
});

test("test broadcast event activity", async () => {
  const sampleEventData = {
    eventType: "event1",
  };
  activityMockContext.bindings.name.eventData = sampleEventData;

  const sampleConversationId = "sampleConversationId";
  activityMockContext.bindings.name.conversationId = sampleConversationId;

  httpFunction(activityMockContext, request);

  expect(activityMockContext.bindings.signalRMessages).toBeDefined();
  expect(activityMockContext.bindings.signalRMessages[0].groupName).toEqual(
    sampleConversationId
  );
  expect(
    activityMockContext.bindings.signalRMessages[0].arguments.length
  ).toEqual(1);
  expect(activityMockContext.bindings.signalRMessages[0].arguments[0]).toEqual(
    sampleEventData
  );
  expect(activityMockContext.bindings.signalRMessages[0].target).toEqual(
    "updateEvent"
  );
});
