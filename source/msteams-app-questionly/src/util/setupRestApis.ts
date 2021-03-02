import { Express as ExpressType } from 'express-serve-static-core';
import { IConversationDataService, IQnASessionDataService } from 'msteams-app-questionly.data';
import { IController } from 'src/controller';
import { configRouter } from 'src/routes/configRestApis';
import { conversationRouter, initializeRouter } from 'src/routes/conversationRestApis';
import { restApiErrorMiddleware } from 'src/routes/restApiErrorMiddleware';
import { ensureAuthenticated, initializeAuthService } from 'src/services/authService';
import { IClientDataContractFormatter } from 'src/util/clientDataContractFormatter';

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
    app.use('/api/conversations', ensureAuthenticated(), conversationRouter);
    app.use('/api', configRouter);
    // Register error handling middleware for rest api routes.
    app.use(restApiErrorMiddleware);
};
