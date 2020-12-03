import { MongoError } from "mongodb";

interface IRetryPolicy {
  retryAfterMs: number;
  maxRetryCount: number;
  maxWaitTime: number;
  shouldRetry: () => boolean;
}

const getConfig = () => {
  return {
    defaultMaxRetryCount: ifNumber(process.env.DefaultMaxRetryCount, 9),
    defaultMaxWaitTime: ifNumber(process.env.DefaultMaxWaitTime, 5000),
    defaultRetryAfterMs: ifNumber(process.env.DefaultRetryAfterMs, 500),
    exponentialRetryAfterMs: ifNumber(process.env.ExponentialRetryAfterMs, 100),
    exponentialRetryMaxWaitTime: ifNumber(
      process.env.exponentialRetryMaxWaitTime,
      10000
    ),
  };
};

/**
 * Default retry policy that retries at a fixed interval
 */
export class DefaultRetryPolicy implements IRetryPolicy {
  retryAfterMs: number;
  maxRetryCount: number;
  maxWaitTime: number;
  private currentRetryCount: number;
  private startTime: number;

  constructor(maxWaitTime?, retryAfterMs?) {
    const config = getConfig();

    this.retryAfterMs = retryAfterMs
      ? retryAfterMs
      : config.defaultRetryAfterMs;
    this.maxRetryCount = config.defaultMaxRetryCount;
    this.currentRetryCount = 0;
    this.startTime = Date.now();
    this.maxWaitTime = maxWaitTime ? maxWaitTime : config.defaultMaxWaitTime;
  }

  public shouldRetry() {
    if (Date.now() - this.startTime > this.maxWaitTime) return false;
    if (this.currentRetryCount < this.maxRetryCount) {
      this.currentRetryCount++;
      return true;
    }
    return false;
  }
}

/**
 * Exponential Back Off Retry Policy
 */
export class ExponentialBackOff extends DefaultRetryPolicy {
  constructor() {
    const config = getConfig();
    super(config.exponentialRetryMaxWaitTime, config.exponentialRetryAfterMs);
  }

  shouldRetry() {
    this.retryAfterMs *= 2;
    return super.shouldRetry();
  }
}

/**
 * Wrapper to retry 16500 (Too Many Requests) error code from database calls
 * @param fn - Function to retry
 * @param retryPolicy - policy to handle retries
 */
export const retryWrapper = async <T>(
  fn,
  retryPolicy?: IRetryPolicy
): Promise<T> => {
  if (!retryPolicy) retryPolicy = new DefaultRetryPolicy();
  try {
    return await fn();
  } catch (error) {
    const mongoError = <MongoError>error;
    if (mongoError.code === 16500) {
      // 16500 is code for Too Many Requests
      if (retryPolicy.shouldRetry()) {
        await _delay(retryPolicy.retryAfterMs);
        return retryWrapper(fn, retryPolicy);
      } else {
        throw error;
      }
    }
    throw error;
  }
};

/**
 * Wrapper to retry 16500 (Too Many Requests) error code and VersionError from database calls
 * @param fn - Function to retry
 * @param retryPolicy - policy to handle retries
 */
export const retryWrapperForConcurrency = async <T>(
  fn,
  retryPolicy?: IRetryPolicy
): Promise<T> => {
  if (!retryPolicy) retryPolicy = new DefaultRetryPolicy();
  try {
    return await fn();
  } catch (error) {
    const mongoError = <MongoError>error;
    if (mongoError.code === 16500 || mongoError.name === "VersionError") {
      // `VersionError` is thrown when document updating changed between when it's loaded and getting updated.
      // 16500 is code for Too Many Requests
      if (retryPolicy.shouldRetry()) {
        await _delay(retryPolicy.retryAfterMs);
        return retryWrapper(fn, retryPolicy);
      } else {
        throw error;
      }
    }
    throw error;
  }
};

const _delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
};

/**
 * Returns `value` if it's a Number, otherwise `otherwise` will be returned
 * @param value - expression that will be returned truthy
 * @param otherwise - expression that will be return if `value` is falsy
 */
export const ifNumber = (value, otherwise) => {
  try {
    return Number(value) ? Number(value) : otherwise;
  } catch {
    return otherwise;
  }
};
