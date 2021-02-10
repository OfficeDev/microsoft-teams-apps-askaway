import { Express as ExpressType } from 'express-serve-static-core';
import { IConversationDataService, IQnASessionDataService } from 'msteams-app-questionly.data';
import { IController } from 'src/controller';
import { initializeRouter, router } from 'src/routes/rest';
import { restApiErrorMiddleware } from 'src/routes/restApiErrorMiddleware';
import { initializeAuthService, ensureAuthenticated } from 'src/services/authService';
import { IClientDataContractFormatter } from './clientDataContractFormatter';

export const setupRestApis = (
    app: ExpressType,
    conversationDataService: IConversationDataService,
    qnaSessionDataService: IQnASessionDataService,
    clientDataContractFormatter: IClientDataContractFormatter,
    controller: IController
) => {
    initializeAuthService(app);

    initializeRouter(conversationDataService, qnaSessionDataService, clientDataContractFormatter, controller);

    // Rest endpoints
    app.use('/api/conversations', ensureAuthenticated(), router);
    // Register error handling middleware for rest api routes.
    app.use(restApiErrorMiddleware);
};
