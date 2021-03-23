// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  BotFrameworkAdapter,
  ConversationAccount,
  TeamsInfo,
  TurnContext,
} from "botbuilder";

const memberNotFoundInConversationError = "MemberNotFoundInConversation";

/**
 * Verifies if the user is a member of conversation.
 * @param botAppId - Microsoft bot id.
 * @param botPassword: Microsoft bot password.
 * @param conversationId: conversationId.
 * @param serviceUrl: service url.
 * @param tenantId: tenat id.
 * @param userId: user id.
 * @param adapter: bot framework adapter (only required for UTs).
 * @returns - boolean value, true if user is a member of conversation.
 * @throws - Throws any excpetion occured during function flow.
 */
export const verifyUserFromConversationId = async (
  botAppId: string,
  botPassword: string,
  conversationId: string,
  serviceUrl: string,
  tenantId: string,
  userId: string,
  adapter?: BotFrameworkAdapter
): Promise<boolean> => {
  try {
    const conversation: ConversationAccount = {
      id: conversationId,
      name: "",
      isGroup: true,
      tenantId: tenantId,
      conversationType: "",
    };

    const conversationReference = {
      serviceUrl: serviceUrl,
      channelId: "msteams",
      conversation: conversation,
    };

    const botAdapter =
      adapter ??
      new BotFrameworkAdapter({
        appId: botAppId,
        appPassword: botPassword,
      });

    await botAdapter.continueConversation(
      conversationReference,
      async (turnContext: TurnContext) => {
        const teamMember = await TeamsInfo.getMember(turnContext, userId);

        // `TeamsInfo.getMember` throws `MemberNotFoundInConversation` exception if user is
        // not part of the conversation. Putting null and undefined checks for additinal safety.
        if (teamMember === null || teamMember === undefined) {
          const error: Error = new Error("Invalid userId");
          error.name = memberNotFoundInConversationError;
          throw error;
        }
      }
    );
  } catch (error) {
    if (
      error.name === memberNotFoundInConversationError ||
      error.code === memberNotFoundInConversationError
    ) {
      return false;
    }

    throw error;
  }

  return true;
};
