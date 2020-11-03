import {
  BotFrameworkAdapter,
  ConversationAccount,
  ConversationReference,
  TeamsInfo,
  TurnContext,
} from "botbuilder";

const memberNotFoundInConversationError: string =
  "MemberNotFoundInConversation";

/**
 * Verifies if the user is a member of conversation.
 * @param conversationId: conversationId.
 * @param userId: userId.
 * @returns - boolean value, true if user is a member of conversation.
 * @throws - logs and throws any excpetion occured during function flow.
 */
export const verifyUserFromConversationId = async (
  conversationId: string,
  userId: string
): Promise<Boolean> => {
  try {
    const conversation: ConversationAccount = {
      id: conversationId,
      name: null,
      isGroup: null,
      tenantId: process.env.TenantId.toString(),
      conversationType: null,
    };

    // TODO: Fetch serviceUrl from DB document instead.
    // Task1211784: https://domoreexp.visualstudio.com/MSTeams/_workitems/edit/1211784
    const conversationReference: ConversationReference = {
      serviceUrl: "https://smba.trafficmanager.net/amer/",
      channelId: "msteams",
      conversation: conversation,
      bot: null,
    };

    const adapter: BotFrameworkAdapter = new BotFrameworkAdapter({
      appId: process.env.MicrosoftAppId.toString(),
      appPassword: process.env.MicrosoftAppPassword.toString(),
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

    // Thow other errors, azure function will return 500 internal server error.
    throw error;
  }

  return true;
};
