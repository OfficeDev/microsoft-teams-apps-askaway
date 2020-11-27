import { Context } from "@azure/functions";

/**
 * Forms 401 Unauthorized response.
 * @param context: azure function context.
 */
export const createUnauthorizedErrorResponse = (context: Context): void => {
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
export const createBadRequestResponse = (
  context: Context,
  error: string
): void => {
  context.res = {
    status: 400,
    body: error,
  };
};

/**
 * Forms 500 Internal server error response.
 * @param context: azure function context.
 */
export const createInternalServerErrorResponse = (context: Context): void => {
  context.res = {
    status: 500,
    body: null,
  };
};
