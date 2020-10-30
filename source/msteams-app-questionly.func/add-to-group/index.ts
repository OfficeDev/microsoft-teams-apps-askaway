import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { authenticateRequest } from "../services/authService";
import { signalRUtility } from "../utils/signalRUtility";
import {
  BotFrameworkAdapter,
  ConversationReference,
  ConversationAccount,
  TeamsInfo,
  TurnContext,
} from "botbuilder";
import { userIdParameterConstant } from "../constants/requestConstants";

const memberNotFoundInConversationError: string =
  "MemberNotFoundInConversation";

/**
 * Verifies if the user is a member of conversation.
 * @param context: azure function context.
 * @param conversationId: conversationId.
 * @param userId: userId.
 * @returns - boolean value, true if user is a member of conversation.
 * @throws - logs and throws any excpetion occured during function flow.
 */
const verifyUserFromConversationId = async (
  context: Context,
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
    context.log.error(error);

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

/**
 * Forms 401 Unauthorized response.
 * @param context: azure function context.
 */
const formUnauthorizedErrorResponse = (context: Context): void => {
  context.res = {
    status: 401,
    body: "Unauthorized",
  };
};

/**
 * Forms 400 Bad request response.
 * @param context: azure function context.
 * @param error: error message.
 */
const formBadRequestResponse = (context: Context, error: string): void => {
  context.res = {
    status: 400,
    body: error,
  };
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const conversationId: string = req.body?.conversationId;
  const connectionId: string = req.body?.connectionId;

  if (conversationId === undefined) {
    formBadRequestResponse(context, `parameter conversationId is missing.`);
    return;
  } else if (connectionId === undefined) {
    formBadRequestResponse(context, `parameter connectionId is missing.`);
    return;
  }

  const isAuthenticRequest: Boolean = await authenticateRequest(context, req);

  if (!isAuthenticRequest) {
    formUnauthorizedErrorResponse(context);
    return;
  }

  const userId: string = req[userIdParameterConstant];
  const isValidUser: Boolean = await verifyUserFromConversationId(
    context,
    conversationId,
    userId
  );

  if (!isValidUser) {
    formUnauthorizedErrorResponse(context);
    return;
  }

  try {
    await signalRUtility.addConnectionToGroup(connectionId, conversationId);
  } catch (error) {
    context.log.error(error);

    if (error["response"]["status"] === 401) {
      formUnauthorizedErrorResponse(context);
    } else if (error["response"]["status"] === 404) {
      context.res = {
        status: 404,
        body: error["message"],
      };
    } else {
      context.res = {
        status: 500,
      };
    }

    return;
  }

  context.res = {
    status: 200,
  };
};

export default httpTrigger;
