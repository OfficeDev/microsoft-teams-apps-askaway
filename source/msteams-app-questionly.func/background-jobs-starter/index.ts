import * as df from "durable-functions";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  createBadRequestResponse,
  createUnauthorizedErrorResponse,
} from "../src/utils/responseUtility";
import { isValidParam, isValidToken } from "../src/utils/requestUtility";
import { errorStrings } from "../src/constants/errorStrings";
import { initiateDBConnection } from "../src/utils/dbUtility";
import { exceptionLogger } from "../src/utils/exceptionTracking";

const httpStart: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const operationId: string = req.body?.operationId;
  const authorizationHeader = req.headers.authorization;

  if (!isValidToken(authorizationHeader)) {
    createUnauthorizedErrorResponse(context);
    return context.res;
  }

  if (!isValidParam(req.body?.conversationId)) {
    createBadRequestResponse(
      context,
      errorStrings.RequestParameterIsMissingError.replace(
        "{0}",
        "conversationId"
      )
    );
    return context.res;
  }

  if (!isValidParam(req.body?.eventData)) {
    createBadRequestResponse(
      context,
      errorStrings.RequestParameterIsMissingError.replace("{0}", "eventData")
    );
    return context.res;
  }

  // Initiate db connection if not initiated already.
  await initiateDBConnection();

  const client = df.getClient(context);
  const instanceId = await client.startNew(
    "background-jobs-orchestrator",
    undefined,
    req.body
  );

  context.log(`Started orchestration with ID = '${instanceId}'.`);

  return client.createCheckStatusResponse(context.bindingData.req, instanceId);
};

export default httpStart;
