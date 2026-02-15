/**
 * Retry utilities for API calls with exponential backoff
 * Provides robust error handling and retry mechanisms
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.message.includes("fetch") ||
      error.message.includes("timeout") ||
      error.message.includes("5") ||
      error.message.includes("ECONNRESET") ||
      error.message.includes("ENOTFOUND")
    );
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's the last attempt or if retry condition is not met
      if (attempt === opts.maxAttempts || !opts.retryCondition(lastError)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay,
      );

      console.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms:`,
        lastError.message,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Retry multiple functions in parallel with individual retry logic
 */
export async function withRetryParallel<T>(
  functions: Array<() => Promise<T>>,
  options: RetryOptions = {},
): Promise<T[]> {
  const promises = functions.map((fn) => withRetry(fn, options));
  return Promise.all(promises);
}
