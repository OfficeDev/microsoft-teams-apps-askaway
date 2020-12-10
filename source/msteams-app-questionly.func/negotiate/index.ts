import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { authenticateRequest } from "../src/services/authService";
import {
  createInternalServerErrorResponse,
  createUnauthorizedErrorResponse,
} from "../src/utils/responseUtility";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  connectionInfo: any
) {
  try {
    const isAuthenticRequest = await authenticateRequest(context, req);

    if (isAuthenticRequest) {
      context.res.json(connectionInfo);
    } else {
      createUnauthorizedErrorResponse(context);
    }
  } catch (error) {
    context.log.error(error);

    createInternalServerErrorResponse(context);
  }
};

export default httpTrigger;
