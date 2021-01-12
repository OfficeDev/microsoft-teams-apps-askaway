import * as passport from 'passport';
import * as passportAzureAd from 'passport-azure-ad';
import { Express as ExpressType } from 'express-serve-static-core';

import { User } from 'msteams-app-questionly.data';
import { exceptionLogger } from 'src/util/exceptionTracking';

/**
 * Fetches tenant id from app settings.
 * @returns - AzureAd tenant id.
 */
const getTenantId = (): string => {
    if (process.env.TenantId === undefined) {
        exceptionLogger('Tenant id is missing in the settings.');
        throw new Error('Tenant id is missing in the settings.');
    }

    return process.env.TenantId.toString().trim();
};

/**
 * Fetches Azure AD client id from app settings.
 * @returns - Azure AD client id.
 */
const getAzureAdClientId = (): string => {
    if (process.env.AzureAd_ClientId === undefined) {
        exceptionLogger('AzureAd ClientId is missing in the settings.');
        throw new Error('AzureAd ClientId is missing in the settings.');
    }

    return process.env.AzureAd_ClientId.toString().trim();
};

/**
 * Fetches Azure AD ApplicationId Uri from app settings.
 * @returns - Azure AD ApplicationId Uri.
 */
const getAzureAdApplicationIdUri = (): string => {
    if (process.env.AzureAd_ApplicationIdUri === undefined) {
        exceptionLogger('AzureAd ApplicationIdUri is missing in the settings.');
        throw new Error('AzureAd ApplicationIdUri is missing in the settings.');
    }

    return process.env.AzureAd_ApplicationIdUri.toString().trim();
};

/**
 * Returns valid audiance.
 * @returns - Valid audiance list.
 */
export const getValidAudiance = (): string[] => {
    return [getAzureAdClientId(), getAzureAdApplicationIdUri()];
};

/**
 * Returns metadata endpoint provided by the Microsoft Identity Portal from app settings.
 * @returns - Metadata endpoint.
 */
export const getIdentityMetadata = (): string => {
    if (process.env.AzureAd_Metadata_Endpoint === undefined) {
        exceptionLogger('Metadata endpoint is missing in the settings.');
        throw new Error('Metadata endpoint is missing in the settings.');
    }

    const tenantId = getTenantId();

    return process.env.AzureAd_Metadata_Endpoint.toString().replace('TENANT_ID', tenantId).trim();
};

/**
 * Fetches Azure AD valid issuers from app settings.
 * @returns - Azure AD valid issuers list.
 */
export const getValidIssuers = (): string[] => {
    if (process.env.AzureAd_ValidIssuers === undefined) {
        exceptionLogger('AzureAd ValidIssuers is missing in the settings.');
        throw new Error('AzureAd ValidIssuers is missing in the settings.');
    }

    let validIssuers: string[] = [];

    const validIssuerFromSettings = process.env.AzureAd_ValidIssuers?.toString().split(',');

    const tenantId = getTenantId();

    validIssuers = validIssuerFromSettings.map((issuer) => {
        return issuer.replace('TENANT_ID', tenantId).trim();
    });

    return validIssuers;
};

export const getBearerStrategy = (): passportAzureAd.BearerStrategy => {
    // Bearer strategy options.
    const options: passportAzureAd.IBearerStrategyOption = {
        validateIssuer: true,
        issuer: getValidIssuers(),
        clientID: getAzureAdClientId(),
        identityMetadata: getIdentityMetadata(),
        audience: getValidAudiance(),
        loggingNoPII: true,
    };

    // Bearer strategy.
    return new passportAzureAd.BearerStrategy(options, (token: passportAzureAd.ITokenPayload, done: passportAzureAd.VerifyCallback) => {
        done(
            null,
            new User({
                _id: token.oid,
                userName: token.name,
            }),
            token
        );
    });
};

/**
 * Initialize auth service.
 * @param app - Express app
 */
export const initializeAuthService = (app: ExpressType): void => {
    passport.use(getBearerStrategy());
    app.use(passport.initialize());
};

/**
 * Authenticate request
 */
export const ensureAuthenticated = (): any => {
    return passport.authenticate('oauth-bearer', { session: false });
};
