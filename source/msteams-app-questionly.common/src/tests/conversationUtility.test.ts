import { BotFrameworkAdapter, ConversationAccount } from "botbuilder";
import { verifyUserFromConversationId } from "../conversationUtility";

const sampleConversationId = "sampleConversationId";
const sampleServiceUrl = "sampleServiceUrl";
const sampleTenantId = "sampleTenantId";
const sampleuserId = "sampleuserId";
const testAdapter: BotFrameworkAdapter = new BotFrameworkAdapter();
let testConversationReference: any;
const sampleAppId = "random";
const sampleAppPassword = "random";

beforeAll(() => {
  (<any>BotFrameworkAdapter) = jest.fn();
  testAdapter.continueConversation = jest.fn();
  (<any>BotFrameworkAdapter).mockImplementation(() => {
    return testAdapter;
  });

  const testConversation: ConversationAccount = {
    id: sampleConversationId,
    name: "",
    isGroup: true,
    tenantId: sampleTenantId,
    conversationType: "",
  };

  testConversationReference = {
    serviceUrl: sampleServiceUrl,
    channelId: "msteams",
    conversation: testConversation,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test("test verify user from conversation id", async () => {
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {});

  let res = await verifyUserFromConversationId(
    sampleAppId,
    sampleAppPassword,
    sampleConversationId,
    sampleServiceUrl,
    sampleTenantId,
    sampleuserId
  );

  expect(res).toBeTruthy();
  expect(BotFrameworkAdapter).toBeCalledTimes(1);
  expect(BotFrameworkAdapter).toBeCalledWith({
    appId: sampleAppId,
    appPassword: sampleAppPassword,
  });
  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );
});

test("test verify user from conversation id when user is not part of the conversation", async () => {
  const testError: Error = new Error();
  testError.name = "MemberNotFoundInConversation";
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {
    throw testError;
  });

  let res = await verifyUserFromConversationId(
    sampleAppId,
    sampleAppPassword,
    sampleConversationId,
    sampleServiceUrl,
    sampleTenantId,
    sampleuserId
  );

  expect(res).not.toBeTruthy();
  expect(BotFrameworkAdapter).toBeCalledTimes(1);
  expect(BotFrameworkAdapter).toBeCalledWith({
    appId: sampleAppId,
    appPassword: sampleAppPassword,
  });
  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );
});

test("test verify user from conversation id - continueConversation throws error other than MemberNotFoundInConversation", async () => {
  const testError: Error = new Error();
  (<any>testAdapter.continueConversation).mockImplementationOnce(() => {
    throw testError;
  });

  await expect(
    verifyUserFromConversationId(
      sampleAppId,
      sampleAppPassword,
      sampleConversationId,
      sampleServiceUrl,
      sampleTenantId,
      sampleuserId
    )
  ).rejects.toThrow(testError);

  expect(BotFrameworkAdapter).toBeCalledTimes(1);
  expect(BotFrameworkAdapter).toBeCalledWith({
    appId: sampleAppId,
    appPassword: sampleAppPassword,
  });
  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );
});
