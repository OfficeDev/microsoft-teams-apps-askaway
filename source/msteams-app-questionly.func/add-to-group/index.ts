import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { userIdParameterConstant } from "../src/constants/requestConstants";
import { verifyUserFromConversationId } from "msteams-app-questionly.conversation.utility";
import { authenticateRequest } from "../src/services/authService";
import { signalRUtility } from "../src/utils/signalRUtility";
import { IConversation } from "msteams-app-questionly.data";
import { getConversationData } from "../src/utils/dbUtility";

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

/**
 * Forms 500 Internal server error response.
 * @param context: azure function context.
 */
const formInternalServerErrorResponse = (context: Context): void => {
  context.res = {
    status: 500,
    body: null,
  };
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
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
    const conversation: IConversation = await getConversationData(
      conversationId
    );
    const isValidUser: Boolean = await verifyUserFromConversationId(
      conversationId,
      conversation.serviceUrl,
      conversation.tenantId,
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

      if (error?.response?.status === 404) {
        context.res = {
          status: 404,
          body: error["message"],
        };
      } else {
        formInternalServerErrorResponse(context);
      }

      return;
    }

    context.res = {
      status: 200,
    };
  } catch (error) {
    context.log.error(error);
    formInternalServerErrorResponse(context);
  }
};

export default httpTrigger;
