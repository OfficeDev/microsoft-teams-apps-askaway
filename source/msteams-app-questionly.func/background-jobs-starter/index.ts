import * as df from "durable-functions";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  createBadRequestResponse,
  createUnauthorizedErrorResponse,
} from "../src/utils/responseUtility";
import {
  isValidParam,
  validateTokenFromAppService,
} from "../src/utils/requestUtility";
import { errorStrings } from "../src/constants/errorStrings";
import { initiateDBConnection } from "../src/utils/dbUtility";

const httpStart: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const isValidToken = await validateTokenFromAppService(context, req);
  if (!isValidToken) {
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
