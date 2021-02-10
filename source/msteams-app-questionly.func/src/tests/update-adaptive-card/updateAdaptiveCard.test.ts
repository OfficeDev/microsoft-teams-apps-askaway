import { BotFrameworkAdapter, ConversationAccount } from "botbuilder";
import { activityMockContext } from "../mocks/testContext";
import httpFunction from "./../../../update-adaptive-card/index";
import { qnaSessionDataService } from "../../utils/dbUtility";
import {
  DataEventType,
  getUpdatedMainCard,
} from "msteams-app-questionly.common";
import { AdaptiveCard } from "adaptivecards";

const sampleServiceUrl = "sampleServiceUrl";
const sampleConversationId = "sampleConversationId";
const sampleQnASessionId = "sampleQnASessionId";
const testAdapter: BotFrameworkAdapter = new BotFrameworkAdapter();
let testConversationReference: any;
let request: any;
let sampleContext: any;
const sampleCard = new AdaptiveCard();

beforeAll(() => {
  testAdapter.continueConversation = jest.fn();
  activityMockContext.bindings.name.botFrameworkAdapter = testAdapter;
  activityMockContext.bindings.name.sampleSericeUrl = sampleServiceUrl;
  activityMockContext.bindings.name.sampleQnASessionId = "sampleQnASessionId";

  (<any>qnaSessionDataService.updateDateTimeCardLastUpdated) = jest.fn();
  (<any>getUpdatedMainCard) = jest.fn();

  (<any>getUpdatedMainCard).mockImplementation(() => {
    return { card: sampleCard, activityId: "1" };
  });

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

test("update adaptive card - post card for qnaSession started event", async () => {
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {});
  activityMockContext.bindings.name.eventData.type =
    DataEventType.qnaSessionCreatedEvent;

  await httpFunction(activityMockContext, request);

  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );

  expect(getUpdatedMainCard).toBeCalledTimes(1);
  expect(getUpdatedMainCard).toBeCalledWith(
    expect.anything(),
    expect.anything(),
    sampleQnASessionId,
    false,
    undefined
  );

  expect(
    <any>qnaSessionDataService.updateDateTimeCardLastUpdated
  ).toBeCalledTimes(0);
});

test("update adaptive card - post card for qnaSession ended event", async () => {
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {});
  activityMockContext.bindings.name.eventData.type =
    DataEventType.qnaSessionEndedEvent;

  await httpFunction(activityMockContext, request);

  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );

  expect(getUpdatedMainCard).toBeCalledTimes(1);
  expect(getUpdatedMainCard).toBeCalledWith(
    expect.anything(),
    expect.anything(),
    sampleQnASessionId,
    true,
    undefined
  );

  expect(
    <any>qnaSessionDataService.updateDateTimeCardLastUpdated
  ).toBeCalledTimes(1);
});

test("update adaptive card - post card for question related event", async () => {
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {});
  activityMockContext.bindings.name.eventData.type =
    DataEventType.newQuestionAddedEvent;

  await httpFunction(activityMockContext, request);

  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );

  expect(getUpdatedMainCard).toBeCalledTimes(1);
  expect(getUpdatedMainCard).toBeCalledWith(
    expect.anything(),
    expect.anything(),
    sampleQnASessionId,
    false,
    undefined
  );

  expect(
    <any>qnaSessionDataService.updateDateTimeCardLastUpdated
  ).toBeCalledTimes(1);
});
