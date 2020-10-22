import Express from 'express';
import { Express as ExpressType } from 'express-serve-static-core';
import { join } from 'path';
import { MsTeamsApiRouter, MsTeamsPageRouter } from 'express-msteams-host';
import * as allComponents from 'src/app/TeamsAppsComponents';

export const setupClientApp = (app: ExpressType) => {
    // Add /scripts and /assets as static folders
    app.use('/app/scripts', Express.static(join(__dirname, 'web/scripts')));
    app.use('/app/web/assets', Express.static(join(__dirname, 'web/assets')));

    // routing for bots, connectors and incoming web hooks - based on the decorators
    // For more information see: https://www.npmjs.com/package/express-msteams-host
    app.use(MsTeamsApiRouter(allComponents));

    // routing for pages for tabs and connector configuration
    // For more information see: https://www.npmjs.com/package/express-msteams-host
    app.use(
        MsTeamsPageRouter({
            root: join(__dirname, 'web/'),
            components: allComponents,
        })
    );

    // Set default web page
    app.use(
        '/',
        Express.static(join(__dirname, 'web/'), {
            index: 'index.html',
        })
    );
};
