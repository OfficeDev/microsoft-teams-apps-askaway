import debug from 'debug';
import { config as dotenvConfig } from 'dotenv';
import Express from 'express';
import { Express as ExpressType } from 'express-serve-static-core';

// Initialize debug logging module
const log = debug('msteams');

log(`Initializing Microsoft Teams Express hosted App...`);

// Initialize dotenv, to use .env file settings if existing.
dotenvConfig();

// The import of components has to be done AFTER the dotenv config.
import { exceptionLogger, initiateAIClient } from 'src/util/exceptionTracking';
import {
    ConversationDataService,
    IConversationDataService,
    initiateConnection,
} from 'msteams-app-questionly.data';
import { getMongoURI, initKeyVault } from 'src/util/keyvault';
import { setupBot } from 'src/util/setupBot';
import { setupClientApp } from 'src/util/setupClientApp';
import { setupRestApis } from 'src/util/setupRestApis';
import { initBackgroundJobSetup } from 'src/background-job/backgroundJobTrigger';
import { initLocalization } from 'src/localization/locale';
import { setupWebServerApp, startWebServer } from 'src/util/webServerUtility';

/**
 * Establishes DB connection.
 */
async function setupDBConection() {
    const mongoDBConnectionString = await getMongoURI();
    // initiate database
    await initiateConnection(mongoDBConnectionString);
}

/**
 * Initialize key vault, localization, DB connection etc.
 */
async function initializeSupportingModules() {
    // Initialize key vault
    initKeyVault();

    // Set up app insights
    await initiateAIClient();

    // Initialize localization
    await initLocalization();

    // Initiate background job setup.
    await initBackgroundJobSetup();

    // Establish db connection.
    await setupDBConection();
}

/**
 * Setup bot routes, client app routes and rest api routes on the app.
 * @param express - express app.
 */
async function setupRoutes(express: ExpressType) {
    const conversationDataService: IConversationDataService = new ConversationDataService();
    // Setup bot.
    await setupBot(express, conversationDataService);

    // Setup client app.
    setupClientApp(express);

    // Setup rest apis.
    setupRestApis(express, conversationDataService);
}

/**
 * Initialize necessary modules and start the webserver.
 */
async function startup() {
    // Initialize key vault, localization, db connection etc.
    await initializeSupportingModules();

    const express = Express();

    // Set up necessary middlewares on the express app.
    setupWebServerApp(express);

    // Configure and register necessary routes on the express app.
    await setupRoutes(express);

    // Start the web server.
    startWebServer(express);
}

startup().catch((error) => {
    log('Error starting web app!');
    exceptionLogger(error);
    throw error;
});
