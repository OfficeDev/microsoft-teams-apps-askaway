import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

/**
 * Creates 400 Bad request response.
 * @param res - response object.
 * @param errorMessage - error message.
 */
export const createResponseForBadRequest = (res: Response, errorMessage: string) => {
    res.status(StatusCodes.BAD_REQUEST).send(errorMessage);
};

/**
 * Creates 500 internal server response.
 * @param res - response object.
 * @param errorMessage - error message.
 */
export const createResponseForInternalServerError = (res: Response, errorMessage: string) => {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(errorMessage);
};

/**
 * Creates 403 Forbidden response when user does not have sufficient permission to access resources.
 * @param res - response object.
 * @param errorMessage - error message.
 */
export const createResponseForForbiddenAccess = (res: Response, errorMessage: string) => {
    res.status(StatusCodes.FORBIDDEN).send(errorMessage);
};
