import { Express as ExpressType } from 'express-serve-static-core';
import { router } from 'src/routes/rest';
import {
    initializeAuthService,
    ensureAuthenticated,
} from 'src/services/authService';

export const setupRestApis = (app: ExpressType) => {
    initializeAuthService(app);

    // Rest endpoints
    app.use('/api/conversations', ensureAuthenticated(), router);
};
