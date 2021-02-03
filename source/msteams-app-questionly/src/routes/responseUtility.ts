import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ClientDataContract } from 'src/contracts/clientDataContract';

/**
 * Creates 400 Bad request response.
 * @param res - response object.
 * @param errorResponse - error response.
 */
export const createResponseForBadRequest = (res: Response, errorResponse: ClientDataContract.errorResponse) => {
    res.status(StatusCodes.BAD_REQUEST).send(errorResponse);
};

/**
 * Creates 500 internal server response.
 * @param res - response object.
 * @param errorResponse - error response.
 */
export const createResponseForInternalServerError = (res: Response, errorResponse: ClientDataContract.errorResponse) => {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(errorResponse);
};

/**
 * Creates 403 Forbidden response when user does not have sufficient permission to access resources.
 * @param res - response object.
 * @param errorResponse - error response.
 */
export const createResponseForForbiddenAccess = (res: Response, errorResponse: ClientDataContract.errorResponse) => {
    res.status(StatusCodes.FORBIDDEN).send(errorResponse);
};
