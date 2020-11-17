import Express from 'express';
import * as http from 'http';
import morgan from 'morgan';
import debug from 'debug';
import compression from 'compression';
import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

import {
    initiateAppInsights,
    exceptionLogger,
} from 'src/util/exceptionTracking';
import { initiateConnection } from 'msteams-app-questionly.data';
import { getMongoURI, initKeyVault } from 'src/util/keyvault';
import { setupBot } from 'src/util/botSetup';
import { setupClientApp } from 'src/util/clientAppSetup';
import { setupRestApis } from 'src/util/restApiSetup';

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

// initialize localization
initLocalization();

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

// Add simple logging
express.use(morgan('tiny'));

// Add compression - uncomment to remove compression
express.use(compression());

async function setupDBConection() {
    const mongoDBConnectionString: string = await getMongoURI();
    // initiate database
    await initiateConnection(mongoDBConnectionString);
}

async function setupApp() {
    // setup bot
    await setupBot(express);

    // setup client app
    setupClientApp(express);

    // setup rest apis
    setupRestApis(express);
}

setupDBConection().catch((error) => {
    exceptionLogger(error);
});

setupApp().catch((error) => {
    exceptionLogger(error);
});

// Set the port
express.set('port', port);

// Start the webserver
http.createServer(express).listen(port, () => {
    log(`Server running on ${port}`);
});
