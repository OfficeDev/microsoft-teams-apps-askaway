import Express from 'express';
import * as http from 'http';
import morgan from 'morgan';
import debug from 'debug';
import compression from 'compression';
import * as appInsights from 'applicationinsights';
import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

import * as jimp from 'jimp';
import * as jwt from 'jsonwebtoken';

import { generateInitialsImage } from 'src/Controller';
import { ConnectorClient } from 'botframework-connector';

// Initialize debug logging module
const log = debug('msteams');

log(`Initializing Microsoft Teams Express hosted App...`);

// Initialize dotenv, to use .env file settings if existing
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

// tslint:export-name
// eslint-disable-next-line @typescript-eslint/tslint/config
export const aiClient = appInsights.defaultClient;

// The import of components has to be done AFTER the dotenv config
import { initLocalization } from 'src/localization/locale';
import { BotFrameworkAdapter, ActivityHandler } from 'botbuilder';
import { requestPolicyHelper } from 'src/app/RequestPolicyHelper';
import { USER_AGENT } from 'botbuilder/lib/botFrameworkAdapter';
import { AskAway } from 'src/app/askAwayBot/AskAway';
import { ifNumber } from 'src/util/RetryPolicies';

// initialize localization
if (initLocalization) initLocalization();

// Create the Express webserver
const express = Express();
const port = process.env.port || process.env.PORT || 3007;

// Inject the raw request body onto the request object
express.use(
    Express.json({
        verify: (req, res, buf: Buffer): void => {
            (<any>req).rawBody = buf.toString();
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

    if (!process.env.AvatarKey)
        return res.sendFile(join(__dirname, 'public/images/anon_avatar.png'));
    jwt.verify(
        token,
        Buffer.from(process.env.AvatarKey, 'utf8').toString('hex'),
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

// Override ConnecterClient to update ExponentialRetryPolicy configuration
(<any>BotFrameworkAdapter.prototype).createConnectorClientInternal = (
    serviceUrl,
    credentials
) => {
    const retryAfterMs = ifNumber(process.env.ExponentialRetryAfterMs, 500);
    const factories = requestPolicyHelper(credentials, {
        retryCount: ifNumber(process.env.DefaultMaxRetryCount, 5),
        retryInterval: retryAfterMs,
        minRetryInterval: retryAfterMs * 0.5,
        maxRetryInterval: retryAfterMs * 10,
    });
    return new ConnectorClient(credentials, {
        baseUri: serviceUrl,
        userAgent: USER_AGENT,
        requestPolicyFactories: <any>factories,
    });
};

// Set up bot and routing
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
});

adapter.onTurnError = async (context, error) => {
    aiClient.trackException({ exception: error });
};

const bot: ActivityHandler = new AskAway();

express.post('/api/messages', (req: any, res: any) => {
    adapter.processActivity(
        req,
        res,
        async (turnContext): Promise<any> => {
            try {
                await bot.run(turnContext);
            } catch (err) {
                adapter.onTurnError(turnContext, err);
            }
        }
    );
});

// Set the port
express.set('port', port);

// Start the webserver
http.createServer(express).listen(port, () => {
    log(`Server running on ${port}`);
});
