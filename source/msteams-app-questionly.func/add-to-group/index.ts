import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { userIdParameterConstant } from "../src/constants/requestConstants";
import { verifyUserFromConversationId } from "msteams-app-questionly.common";
import { authenticateRequest } from "../src/services/authService";
import { signalRUtility } from "../src/utils/signalRUtility";
import { IConversation } from "msteams-app-questionly.data";
import {
  getConversationData,
  initiateDBConnection,
} from "../src/utils/dbUtility";
import {
  createBadRequestResponse,
  createInternalServerErrorResponse,
  createUnauthorizedErrorResponse,
} from "../src/utils/responseUtility";
import { isValidParam } from "../src/utils/requestUtility";
import { errorStrings } from "../src/constants/errorStrings";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    const conversationId: string = req.body?.conversationId;
    const connectionId: string = req.body?.connectionId;

    // Validate request parameters.
    if (!isValidParam(conversationId)) {
      createBadRequestResponse(
        context,
        errorStrings.RequestParameterIsMissingError.replace(
          "{0}",
          "conversationId"
        )
      );
      return;
    } else if (!isValidParam(connectionId)) {
      createBadRequestResponse(
        context,
        errorStrings.RequestParameterIsMissingError.replace(
          "{0}",
          "connectionId"
        )
      );
      return;
    }

    // Authenticate the request.
    const isAuthenticRequest: Boolean = await authenticateRequest(context, req);

    if (!isAuthenticRequest) {
      createUnauthorizedErrorResponse(context);
      return;
    }

    // Initiate db connection if not initiated already.
    await initiateDBConnection();

    const userId: string = req[userIdParameterConstant];
    const conversation: IConversation = await getConversationData(
      conversationId
    );

    // Check if user is part of conversation.
    const isValidUser: Boolean = await verifyUserFromConversationId(
      process.env.MicrosoftAppId,
      process.env.MicrosoftAppPassword,
      conversationId,
      conversation.serviceUrl,
      conversation.tenantId,
      userId
    );

    if (!isValidUser) {
      createUnauthorizedErrorResponse(context);
      return;
    }

    try {
      // Add connection to the group.
      await signalRUtility.addConnectionToGroup(connectionId, conversationId);
    } catch (error) {
      context.log.error(error);

      if (error?.response?.status === 404) {
        context.res = {
          status: 404,
          body: error["message"],
        };
      } else {
        createInternalServerErrorResponse(context);
      }

      return;
    }

    context.res = {
      status: 200,
    };
  } catch (error) {
    context.log.error(error);
    createInternalServerErrorResponse(context);
  }
};

export default httpTrigger;
