import Express from 'express';
import { StatusCodes } from 'http-status-codes';

export const configRouter = Express.Router();

// Get variable from app env
configRouter.get('/config', async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
        if (process.env.ApplicationInsightsInstrumentationKey && process.env.SignalRFunctionBaseUrl) {
            const response = {
                ApplicationInsightsInstrumentationKey: `${process.env.ApplicationInsightsInstrumentationKey}`,
                SignalRFunctionBaseUrl: `${process.env.SignalRFunctionBaseUrl}`,
            };

            res.status(StatusCodes.OK).send(response);
            return;
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
            return;
        }
    } catch (error) {
        next(error);
    }
});
