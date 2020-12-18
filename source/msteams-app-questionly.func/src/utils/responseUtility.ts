import { Context } from "@azure/functions";
import { StatusCodes } from "http-status-codes";

/**
 * Forms 401 Unauthorized response.
 * @param context: azure function context.
 */
export const createUnauthorizedErrorResponse = (context: Context): void => {
  context.res = {
    status: StatusCodes.UNAUTHORIZED,
    body: "Unauthorized",
  };
};

/**
 * Forms 400 Bad request response.
 * @param context: azure function context.
 * @param error: error message.
 */
export const createBadRequestResponse = (
  context: Context,
  error: string
): void => {
  context.res = {
    status: StatusCodes.BAD_REQUEST,
    body: error,
  };
};

/**
 * Forms 500 Internal server error response.
 * @param context: azure function context.
 */
export const createInternalServerErrorResponse = (context: Context): void => {
  context.res = {
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    body: null,
  };
};
