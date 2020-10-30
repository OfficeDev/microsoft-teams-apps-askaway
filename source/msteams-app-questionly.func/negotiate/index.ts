import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { authenticateRequest } from "../services/authService";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  connectionInfo: any
) {
  try {
    const isAuthenticRequest: Boolean = await authenticateRequest(context, req);

    if (isAuthenticRequest) {
      context.res.json(connectionInfo);
    } else {
      context.res = {
        status: 401,
        body: "Unauthorized",
      };
    }
  } catch (error) {
    context.log.error(error);

    context.res = {
      status: 500,
    };
  }
};

export default httpTrigger;
