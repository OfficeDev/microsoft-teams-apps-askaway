import { BotFrameworkAdapter, ConversationAccount } from "botbuilder";
import { activityMockContext } from "../mocks/testContext";
import httpFunction from "./../../../send-notification-bubble/index";
import { DataEventType } from "msteams-app-questionly.common";

const sampleServiceUrl = "sampleServiceUrl";
const sampleConversationId = "sampleConversationId";
const testAdapter: BotFrameworkAdapter = new BotFrameworkAdapter();
let testConversationReference: any;
let request: any;
let sampleContext: any;

beforeAll(() => {
  process.env.AppId = "random";
  process.env.NotificationBubblePageUrl = "random";

  testAdapter.continueConversation = jest.fn();
  activityMockContext.bindings.name.botFrameworkAdapter = testAdapter;
  activityMockContext.bindings.name.sampleSericeUrl = sampleServiceUrl;

  const testConversation = {
    id: sampleConversationId,
  } as ConversationAccount;

  testConversationReference = {
    serviceUrl: sampleServiceUrl,
    channelId: "msteams",
    conversation: testConversation,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  request = {
    body: {
      context: sampleContext,
    },
    headers: null,
  };
});

test("send notifcation bubble - `questionUpvotedEvent` events should not send notification bubble", async () => {
  activityMockContext.bindings.name.eventData.type =
    DataEventType.questionUpvotedEvent;
  await httpFunction(activityMockContext, request);

  expect(testAdapter.continueConversation).toBeCalledTimes(0);
});

test("send notifcation bubble - `questionDownvotedEvent` events should not send notification bubble", async () => {
  activityMockContext.bindings.name.eventData.type =
    DataEventType.questionDownvotedEvent;
  await httpFunction(activityMockContext, request);

  expect(testAdapter.continueConversation).toBeCalledTimes(0);
});

test("send notifcation bubble - `questionMarkedAsAnsweredEvent` events should not send notification bubble", async () => {
  activityMockContext.bindings.name.eventData.type =
    DataEventType.questionMarkedAsAnsweredEvent;
  await httpFunction(activityMockContext, request);

  expect(testAdapter.continueConversation).toBeCalledTimes(0);
});

test("send notifcation bubble - `newQuestionAddedEvent` events should not send notification bubble", async () => {
  activityMockContext.bindings.name.eventData.type =
    DataEventType.newQuestionAddedEvent;
  await httpFunction(activityMockContext, request);

  expect(testAdapter.continueConversation).toBeCalledTimes(0);
});

test("send notifcation bubble - continueConversation success", async () => {
  activityMockContext.bindings.name.eventData.type =
    DataEventType.qnaSessionCreatedEvent;
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {});

  await httpFunction(activityMockContext, request);

  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );
});

test("send notifcation bubble - continueConversation throws error", async () => {
  activityMockContext.bindings.name.eventData.type =
    DataEventType.qnaSessionEndedEvent;
  const testError: Error = new Error();
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {
    throw testError;
  });

  await expect(httpFunction(activityMockContext, request)).rejects.toThrow(
    testError
  );

  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );
});
