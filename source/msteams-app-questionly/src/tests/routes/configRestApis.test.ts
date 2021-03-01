import Express from 'express';
import request from 'supertest';
import { Express as ExpressType } from 'express-serve-static-core';
import { restApiErrorMiddleware } from 'src/routes/restApiErrorMiddleware';
import { configRouter } from 'src/routes/configRestApis';
import { StatusCodes } from 'http-status-codes';

let app: ExpressType;
const sampleUserId = 'sampleUserId';
const sampleUserName = 'sampleUserName';

describe('test get /config/:variableName api', () => {
    beforeAll(async () => {
        app = Express();

        const mockEnsureAuthenticated = (req, res, next) => {
            req.user = {
                _id: sampleUserId,
                userName: sampleUserName,
            };
            next();
        };
        // Rest endpoints
        app.use('/api/config', mockEnsureAuthenticated, configRouter);
        app.use(restApiErrorMiddleware);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('variable defined in app env', async () => {
        process.env.ApplicationInsightsInstrumentationKey = 'random';
        process.env.SignalRFunctionBaseUrl = 'random';
        const result = await request(app).get(`/api/config`);

        expect(result.status).toEqual(StatusCodes.OK);
        expect(result).toBeDefined();
        const res = JSON.parse(result.text);
        expect(res.ApplicationInsightsInstrumentationKey).toEqual('random');
        expect(res.SignalRFunctionBaseUrl).toEqual('random');
    });

    it('variable not defined in app env', async () => {
        delete process.env.ApplicationInsightsInstrumentationKey;
        const result = await request(app).get(`/api/config`);

        expect(result.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('variable not defined in app env', async () => {
        delete process.env.SignalRFunctionBaseUrl;
        const result = await request(app).get(`/api/config`);

        expect(result.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    });
});
