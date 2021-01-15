import { Express as ExpressType } from 'express-serve-static-core';
import { IConversationDataService } from 'msteams-app-questionly.data';
import { initializeRouter, router } from 'src/routes/rest';
import { restApiErrorMiddleware } from 'src/routes/restApiErrorMiddleware';
import { initializeAuthService, ensureAuthenticated } from 'src/services/authService';

export const setupRestApis = (app: ExpressType, conversationDataService: IConversationDataService) => {
    initializeAuthService(app);

    initializeRouter(conversationDataService);

    // Rest endpoints
    app.use('/api/conversations', ensureAuthenticated(), router);
    // Register error handling middleware for rest api routes.
    app.use(restApiErrorMiddleware);
};
