// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

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
  (<any>testAdapter.continueConversation) = jest.fn();
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
    sampleuserId,
    testAdapter
  );

  expect(res).toBeTruthy();
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
    sampleuserId,
    testAdapter
  );

  expect(res).not.toBeTruthy();
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
      sampleuserId,
      testAdapter
    )
  ).rejects.toThrow(testError);

  expect(testAdapter.continueConversation).toBeCalledTimes(1);
  expect(testAdapter.continueConversation).toBeCalledWith(
    testConversationReference,
    expect.anything()
  );
});
