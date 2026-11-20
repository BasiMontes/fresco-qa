import { test } from '@playwright/test';
import { env } from '@variables';

export class RateLimitError extends Error {
  constructor(message = 'rate limit reached') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export async function runUnlessRateLimited<T>(action: () => Promise<T>): Promise<T | void> {
  try {
    return await action();
  }
  catch (error) {
    if (!(error instanceof RateLimitError)) {
      throw error;
    }
    if (env.isCI) {
      throw new Error('rate limit window used: the run cannot verify menu safety', { cause: error });
    }
    // eslint-disable-next-line playwright/no-skipped-test -- a spent hourly quota is NOT RUN, not a failure
    test.skip(true, 'rate limit window used (5 menu generations per hour per user): NOT RUN, not a failure');
  }
}
