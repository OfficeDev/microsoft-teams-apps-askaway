import Express from 'express';
import * as http from 'http';
import morgan from 'morgan';
import debug from 'debug';
import compression from 'compression';
import {
    initiateAppInsights,
    exceptionLogger,
} from 'src/util/ExceptionTracking';
import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';
import { initiateConnection } from 'src/Data/Database';

import * as jimp from 'jimp';
import * as jwt from 'jsonwebtoken';

import { generateInitialsImage } from 'src/Controller';
import { ConnectorClient } from 'botframework-connector';

import {
    initKeyVault,
    getMicrosoftAppPassword,
    getAvatarKey,
} from 'src/util/keyvault';

import { router } from './routes/rest';
import {
    initializeAuthService,
    ensureAuthenticated,
} from './services/authService';

import { MsTeamsApiRouter, MsTeamsPageRouter } from 'express-msteams-host';
import * as allComponents from './app/TeamsAppsComponents';

// Initialize debug logging module
const log = debug('msteams');

log(`Initializing Microsoft Teams Express hosted App...`);

// Initialize dotenv, to use .env file settings if existing
dotenvConfig();

// Initialize key vault
initKeyVault();

// Set up app insights
initiateAppInsights();

// The import of components has to be done AFTER the dotenv config
import { initLocalization } from 'src/localization/locale';
import { BotFrameworkAdapter, ActivityHandler } from 'botbuilder';
import { requestPolicyHelper } from 'src/util/requestPolicyHelper';
import { USER_AGENT } from 'botbuilder/lib/botFrameworkAdapter';
import { AskAway } from 'src/askAway';
import { ifNumber } from 'src/util/RetryPolicies';

// initialize localization
initLocalization();

// Create the Express webserver
const express = Express();
const port = process.env.port || process.env.PORT || 3007;
initializeAuthService(express);

// Rest endpoints
express.use('/api/conversations', ensureAuthenticated(), router);

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

express.get('/avatar/:token', async (req, res) => {
    const token = req.params.token;
    // if (token == null) return res.sendStatus(401);

    const avatarKey = await getAvatarKey();

    if (!avatarKey)
        return res.sendFile(join(__dirname, 'public/images/anon_avatar.png'));
    jwt.verify(
        token,
        Buffer.from(avatarKey, 'utf8').toString('hex'),
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

// Add /scripts and /assets as static folders
express.use('/app/scripts', Express.static(join(__dirname, 'web/scripts')));
express.use('/app/web/assets', Express.static(join(__dirname, 'web/assets')));

// routing for bots, connectors and incoming web hooks - based on the decorators
// For more information see: https://www.npmjs.com/package/express-msteams-host
express.use(MsTeamsApiRouter(allComponents));

// routing for pages for tabs and connector configuration
// For more information see: https://www.npmjs.com/package/express-msteams-host
express.use(
    MsTeamsPageRouter({
        root: join(__dirname, 'web/'),
        components: allComponents,
    })
);

// Set default web page
express.use(
    '/',
    Express.static(join(__dirname, 'web/'), {
        index: 'index.html',
    })
);

// initiate database
initiateConnection().catch((error) => {
    exceptionLogger(error);
});

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

const bot: ActivityHandler = new AskAway();

async function setupBotAdapterAndRouting() {
    const adapter = new BotFrameworkAdapter({
        appId: process.env.MicrosoftAppId,
        appPassword: await getMicrosoftAppPassword(),
    });

    adapter.onTurnError = async (context, error) => {
        exceptionLogger(error);
    };

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
}

// Set up bot and routing
setupBotAdapterAndRouting().catch((error) => {
    exceptionLogger(error);
});

// Set the port
express.set('port', port);

// Start the webserver
http.createServer(express).listen(port, () => {
    log(`Server running on ${port}`);
});
