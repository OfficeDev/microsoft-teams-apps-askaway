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
import { StatusCodes } from "http-status-codes";
import { exceptionLogger } from "../src/utils/exceptionTracking";
import { getMicrosoftAppPassword } from "../src/utils/keyvaultUtility";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const conversationId: string = req.body?.conversationId;
  const connectionId: string = req.body?.connectionId;
  const operationId: string = req.body?.operationId;
  let userId: string;

  try {
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
    const isAuthenticRequest = await authenticateRequest(context, req);

    if (!isAuthenticRequest) {
      createUnauthorizedErrorResponse(context);
      return;
    }

    // Initiate db connection if not initiated already.
    await initiateDBConnection();

    userId = req[userIdParameterConstant];
    const conversation: IConversation = await getConversationData(
      conversationId
    );

    // Check if user is part of conversation.
    const isValidUser = await verifyUserFromConversationId(
      process.env.MicrosoftAppId,
      getMicrosoftAppPassword(),
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
      exceptionLogger(error, operationId, {
        conversationId: conversationId,
        tenantId: conversation.tenantId,
        userAadObjectId: userId,
        filename: module.id,
      });

      if (error?.response?.status === StatusCodes.NOT_FOUND) {
        context.res = {
          status: StatusCodes.NOT_FOUND,
          body: error["message"],
        };
      } else {
        createInternalServerErrorResponse(context);
      }

      return;
    }

    context.res = {
      status: StatusCodes.OK,
    };
  } catch (error) {
    context.log.error(error);
    exceptionLogger(error, operationId, {
      conversationId: conversationId,
      userAadObjectId: userId,
      filename: module.id,
    });
    createInternalServerErrorResponse(context);
  }
};

export default httpTrigger;
