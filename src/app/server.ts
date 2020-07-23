import Express from 'express';
import * as http from 'http';
import morgan from 'morgan';
import { MsTeamsApiRouter } from 'express-msteams-host';
import debug from 'debug';
import compression from 'compression';
import * as appInsights from 'applicationinsights';
import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

import * as jimp from 'jimp';
import * as jwt from 'jsonwebtoken';

import { generateInitialsImage } from './../Controller';

// Initialize debug logging module
const log = debug('msteams');

log(`Initializing Microsoft Teams Express hosted App...`);

// Initialize dotenv, to use .env file settings if existing
// tslint:disable-next-line:no-var-requires
dotenvConfig();

// Set up app insights
appInsights
    .setup(process.env.ApplicationInsightsInstrumentationKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI);
appInsights.start();

export const aiClient = appInsights.defaultClient;

// The import of components has to be done AFTER the dotenv config
import * as allComponents from './TeamsAppsComponents';
import { initLocalization } from '../localization/locale';

// initialize localization
initLocalization();

// Create the Express webserver
const express = Express();
const port = process.env.port || process.env.PORT || 3007;

// Inject the raw request body onto the request object
express.use(
    Express.json({
        verify: (req, res, buf: Buffer): void => {
            (req as any).rawBody = buf.toString();
        },
    })
);

express.use(Express.urlencoded({ extended: true }));

// Add serving of static files
express.use(Express.static(join(__dirname, 'public')));

interface AvatarRequest {
    initials: string;
    index: number;
}

express.get('/avatar/:token', (req, res) => {
    const token = req.params.token;
    // if (token == null) return res.sendStatus(401);

    jwt.verify(
        token,
        Buffer.from(process.env.AvatarKey as string, 'utf8').toString('hex'),
        (err, data: AvatarRequest) => {
            if (err)
                return res.sendFile(
                    join(__dirname, 'public/images/anon_avatar.png')
                );
            generateInitialsImage(data.initials, data.index).then((image) => {
                image.getBuffer(jimp.MIME_PNG, (err, buffer) => {
                    res.set('Content-Type', jimp.MIME_PNG);
                    return res.send(buffer);
                });
            });
        }
    );
});

// Add simple logging
express.use(morgan('tiny'));

// Add compression - uncomment to remove compression
express.use(compression());

// routing for bots, connectors and incoming web hooks - based on the decorators
// For more information see: https://www.npmjs.com/package/express-msteams-host
express.use(MsTeamsApiRouter(allComponents));

// Set the port
express.set('port', port);

// Start the webserver
http.createServer(express).listen(port, () => {
    log(`Server running on ${port}`);
});
