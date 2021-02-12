import { DefaultAzureCredential } from '@azure/identity';

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
    const accessToken = await getCredential().getToken('https://management.azure.com/.default');
    return accessToken;
};
