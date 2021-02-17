import { DefaultAzureCredential } from '@azure/identity';
import { exceptionLogger } from './exceptionTracking';

let credential: DefaultAzureCredential;

/**
 * Get DefaultAzureCredential instance.
 */
export const getCredential = () => {
    if (!credential) {
        credential = new DefaultAzureCredential();
    }
    return credential;
};

/**
 * Get token using DefaultAzureCredential.
 */
export const getAccessToken = async () => {
    if (!process.env.MicrosoftAppId) {
        exceptionLogger(new Error('MicrosoftAppId missing in app settings.'));
        throw new Error('MicrosoftAppId missing in app settings.');
    }
    const accessToken = await getCredential().getToken(process.env.MicrosoftAppId);
    return accessToken;
};
