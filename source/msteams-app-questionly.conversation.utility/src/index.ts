import {
  BotFrameworkAdapter,
  ConversationAccount,
  TeamsInfo,
  TurnContext,
} from "botbuilder";

const memberNotFoundInConversationError: string =
  "MemberNotFoundInConversation";

/**
 * Verifies if the user is a member of conversation.
 * @param conversationId: conversationId.
 * @param serviceUrl: service url.
 * @param tenantId: tenat id.
 * @param userId: user id.
 * @returns - boolean value, true if user is a member of conversation.
 * @throws - Throws any excpetion occured during function flow.
 */
export const verifyUserFromConversationId = async (
  conversationId: string,
  serviceUrl: string,
  tenantId: string,
  userId: string
): Promise<Boolean> => {
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

    const adapter: BotFrameworkAdapter = new BotFrameworkAdapter({
      appId: process.env.MicrosoftAppId?.toString(),
      appPassword: process.env.MicrosoftAppPassword?.toString(),
    });

    await adapter.continueConversation(
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
