import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { exceptionLogger } from 'src/util/exceptionTracking';
import memoryCache, { CacheClass } from 'memory-cache';
import { ifNumber } from 'src/util/typeUtility';

const vaultName = process.env.KeyVaultName;
const mongoURISecretName = 'MongoDbUri';
const applicationInsightsInstrumentationKeySecretName = 'ApplicationInsightsInstrumentationKey';
const microsoftAppPasswordSecretName = 'MicrosoftAppPassword';
const avatarKeySecretName = 'AvatarKey';
const backgroundFunctionKeySecretName = 'BackgroundFunctionKey';

let memCache: CacheClass<string, string>;
let keyVaultSecretClient: SecretClient;

/**
 * Initialize memory cache and secret client for key vault.
 */
export const initKeyVault = () => {
    memCache = new memoryCache.Cache();

    const credential = new DefaultAzureCredential();
    const url = `https://${vaultName}.vault.azure.net`;

    keyVaultSecretClient = new SecretClient(url, credential);
};

/**
 * Read and return secret from app settings.
 * @param secretName - Secret that needs to be read.
 * @returns - Value of secret.
 * @throws - Error that occurs while reading secret.
 */
const getSecretFromAppSettings = (secretName: string): string => {
    const secretValue = process.env[secretName];

    if (secretValue === undefined) {
        throw new Error(`Secret not set in app settings: ${secretName}`);
    }

    return secretValue;
};

/**
 * Read and return secret from key vault.
 * @param secretName - Secret that needs to be read.
 * @returns - Value of secret.
 * @throws - Error that occurs while reading secret.
 */
const getSecretFromVault = async (secretName: string): Promise<string> => {
    // For local development, read values from app settings instead.
    if (process.env.debugMode === 'true') {
        return getSecretFromAppSettings(secretName);
    }

    const secret = await keyVaultSecretClient.getSecret(secretName);

    if (secret.value === undefined) {
        exceptionLogger(new Error(`Error in reading key vault secret: ${secretName}`));

        throw new Error(`Error in reading key vault secret: ${secretName}`);
    }

    return secret.value;
};

/**
 * This method tries to read secret from cache and if not found fetches from key vault and updates cache.
 * @param secretName - Secret that needs to be read.
 * @returns - Value of secret.
 * @throws - Error that occurs while reading secret.
 */
const getSecretFromCache = async (secretName: string): Promise<string> => {
    const secretValueFromCache = memCache.get(secretName);

    if (secretValueFromCache === null) {
        const secret = await getSecretFromVault(secretName);

        // Secrets last in memory for some time (default 24 hours), post that cache should be updated from key vault.
        // Currently only `AvatarKey` and `MicrosoftAppPassword` are set in cache as it's used multiple time.
        // All other secrets are used once during initialization hence fetched from key vault directly.
        const retryAfterMs = ifNumber(process.env.ExpireInMemorySecretsAfterMs, 24 * 60 * 60 * 1000);
        memCache.put(secretName, secret, retryAfterMs);

        return secret;
    } else {
        return secretValueFromCache;
    }
};

/**
 * Reads and returns mongo DB URI from key vault.
 * @returns - Mongo DB URI.
 * @throws - Error if error occurs while fetching secret from key vault.
 */
export const getMongoURI = async (): Promise<string> => {
    return await getSecretFromVault(mongoURISecretName);
};

/**
 * Reads and returns Application Insights Instrumentation Key from key vault.
 * @returns - Application Insights Instrumentation Key.
 * @throws - Error if error occurs while fetching secret from key vault.
 */
export const getApplicationInsightsInstrumentationKeyURI = async (): Promise<string> => {
    return await getSecretFromVault(applicationInsightsInstrumentationKeySecretName);
};

/**
 * Reads and returns Microsoft App Password from key vault.
 * @returns - Microsoft App Password.
 * @throws - Error if error occurs while fetching secret from key vault.
 */
export const getMicrosoftAppPassword = async (): Promise<string> => {
    return await getSecretFromCache(microsoftAppPasswordSecretName);
};

/**
 * Reads and returns avatar key from cache, if not found get it from key vault.
 * This method does not throw any exception as, if the key is not found, flow returns public avatar (does not break).
 * @returns - Avatar key or undefined if error occurs.
 */
export const getAvatarKey = async (): Promise<string | undefined> => {
    try {
        return await getSecretFromCache(avatarKeySecretName);
    } catch (error) {
        exceptionLogger(new Error(`Error in getting avatar key.`));

        return undefined;
    }
};
