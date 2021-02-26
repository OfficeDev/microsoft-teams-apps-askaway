import Express from 'express';
import { join } from 'path';
import morgan from 'morgan';
import compression from 'compression';
import { Express as ExpressType } from 'express-serve-static-core';
import * as http from 'http';
import debug from 'debug';

// Initialize debug logging module
const log = debug('msteams');

const getPort = () => {
    return process.env.port || process.env.PORT || 3007;
};

/**
 * Configures express app with necessary middlewares.
 * @param express - express app.
 */
export const setupWebServerApp = (express: ExpressType) => {
    // Set the port
    express.set('port', getPort());

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
};

/**
 * Starts web server.
 * @param express - express app.
 */
export const startWebServer = (express: ExpressType) => {
    const port = getPort();
    // Start the webserver
    http.createServer(express).listen(port, () => {
        log(`Server running on ${port}`);
    });
};
