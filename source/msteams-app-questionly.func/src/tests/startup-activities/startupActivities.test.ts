import { BotFrameworkAdapter, ConversationAccount } from "botbuilder";
import { getConversationData, setActivityId } from "../../utils/dbUtility";
import { activityMockContext } from "../mocks/testContext";
import httpFunction from "./../../../startup-activities/index";

const sampleConversationId = "sampleConversationId";
let request: any;
let sampleContext: any;

beforeAll(() => {
  (<any>getConversationData) = jest.fn();
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

test("update adaptive card - getConversationData success", async () => {
  (<any>getConversationData).mockImplementationOnce(() => {});

  await httpFunction(activityMockContext, request);

  expect(getConversationData).toBeCalledTimes(1);
  expect(getConversationData).toBeCalledWith(sampleConversationId);
});

test("update adaptive card - getConversationData throws error", async () => {
  const testError: Error = new Error();
  (<any>getConversationData).mockImplementationOnce(() => {
    throw testError;
  });

  await expect(httpFunction(activityMockContext, request)).rejects.toThrow(
    testError
  );

  expect(getConversationData).toBeCalledTimes(1);
  expect(getConversationData).toBeCalledWith(sampleConversationId);
});
