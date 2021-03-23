// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import Express from 'express';
import { StatusCodes } from 'http-status-codes';

export const healthEndpointRouter = Express.Router();

// Health end point.
healthEndpointRouter.get('/', async (req: Express.Request, res: Express.Response, _next: Express.NextFunction) => {
    res.status(StatusCodes.OK).send();
});
