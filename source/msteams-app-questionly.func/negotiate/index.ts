import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { isValidToken } from "../services/authService";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  connectionInfo: any
) {
  try {
    var token = req.headers["authorization"];

    const isTokenValid: Boolean = await isValidToken(context, token);

    if (isTokenValid) {
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
