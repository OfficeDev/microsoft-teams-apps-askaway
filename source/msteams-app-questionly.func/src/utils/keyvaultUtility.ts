import memoryCache, { CacheClass } from "memory-cache";
import { exceptionLogger } from "./exceptionTracking";
import { ifNumber } from "./typeUtility";

const microsoftAppPasswordSecretName = "MicrosoftAppPassword";
const avatarKeySecretName = "AvatarKey";

let memCache: CacheClass<string, string>;

/**
 * Initialize and Get memory cache instance.
 */
export const getMemCacheInstance = () => {
  if (!memCache) {
    memCache = new memoryCache.Cache();
  }
  return memCache;
};

/**
 * If the secret is present in cache, read from cache, else read from app settings and put it in cache.
 * @param secretName - Secret to be read.
 * @returns - Value of secret.
 */
const getSecretFromCache = (secretName: string): string => {
  let secretValue = getMemCacheInstance().get(secretName);

  if (secretValue === null) {
    secretValue = process.env[secretName];
    const retryAfterMs = ifNumber(
      process.env.ExpireInMemorySecretsAfterMs,
      24 * 60 * 60 * 1000
    );
    memCache.put(secretName, secretValue, retryAfterMs);
  }
  return secretValue;
};

/**
 * Reads and returns Microsoft App Password from cache.
 * @returns - Microsoft App Password.
 * @throws - Error if error occurs while fetching secret from key vault.
 */
export const getMicrosoftAppPassword = (): string => {
  try {
    return getSecretFromCache(microsoftAppPasswordSecretName);
  } catch (error) {
    exceptionLogger(
      new Error(`Error in getting microsoft app password from cache.`)
    );
  }
};

/**
 * Reads and returns avatar key from cache.
 * @returns - Avatar key.
 * @throws - Error if error occurs while fetching secret from key vault.
 */
export const getAvatarKey = (): string => {
  try {
    return getSecretFromCache(avatarKeySecretName);
  } catch (error) {
    exceptionLogger(new Error(`Error in getting avatar key from cache.`));
  }
};
