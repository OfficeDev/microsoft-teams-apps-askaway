import { BotFrameworkAdapter, ConversationAccount } from "botbuilder";
import { setActivityId } from "../../utils/dbUtility";
import { activityMockContext } from "../mocks/testContext";
import httpFunction from "./../../../update-adaptive-card/index";

const sampleServiceUrl = "sampleServiceUrl";
const sampleConversationId = "sampleConversationId";
const testAdapter: BotFrameworkAdapter = new BotFrameworkAdapter();
let testConversationReference: any;
let request: any;
let sampleContext: any;

beforeAll(() => {
  process.env.MicrosoftAppId = "random";
  process.env.MicrosoftAppPassword = "random";

  (<any>BotFrameworkAdapter) = jest.fn();
  testAdapter.continueConversation = jest.fn();
  (<any>setActivityId) = jest.fn();
  (<any>BotFrameworkAdapter).mockImplementation(() => {
    return testAdapter;
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

test("update adaptive card - continueConversation success", async () => {
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {});

  await httpFunction(activityMockContext, request);

  expect(BotFrameworkAdapter).toBeCalledTimes(1);
  expect(BotFrameworkAdapter).toBeCalledWith({
    appId: process.env.MicrosoftAppId?.toString(),
    appPassword: process.env.MicrosoftAppPassword?.toString(),
  });
  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );
});

test("update adaptive card - continueConversation throws error", async () => {
  const testError: Error = new Error();
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {
    throw testError;
  });

  await expect(httpFunction(activityMockContext, request)).rejects.toThrow(
    testError
  );

  expect(BotFrameworkAdapter).toBeCalledTimes(1);
  expect(BotFrameworkAdapter).toBeCalledWith({
    appId: process.env.MicrosoftAppId?.toString(),
    appPassword: process.env.MicrosoftAppPassword?.toString(),
  });
  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );
});
