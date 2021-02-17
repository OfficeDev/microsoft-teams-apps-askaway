import memoryCache, { CacheClass } from 'memory-cache';

let memCache: CacheClass<string, string>;

/**
 * Initialize memory cache instance.
 */
export const initializeCacheInstance = () => {
    memCache = new memoryCache.Cache();
};

/**
 * Get value for the given key from memory cache instance.
 * @param key - the key to be searched in mem cahce.
 * @returns - value for the key if found, else returns null.
 */
export const getFromMemoryCache = (key: string): string | null => {
    return memCache.get(key);
};

/**
 * Put key and its value in memory cache instance.
 * @param key - key.
 * @param value - value corresponding to the key.
 * @param retryAfterMs - expires in memeory after ms.
 */
export const putIntoMemoryCache = (key: string, value: string, retryAfterMs: number) => {
    memCache.put(key, value, retryAfterMs);
};
