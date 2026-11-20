process.env.CI = 'true';

const { RateLimitError, runUnlessRateLimited } = await import('@utils/quota');
const { describe, expect, test } = await import('bun:test');

describe('runUnlessRateLimited', () => {
  test('returns the action result', async () => {
    expect(await runUnlessRateLimited(async () => 7)).toBe(7);
  });

  test('rethrows other errors untouched', async () => {
    const error = await runUnlessRateLimited(async () => {
      throw new Error('boom');
    }).catch((caught: unknown) => caught);
    expect((error as Error).message).toBe('boom');
  });

  test('fails with the window message on CI', async () => {
    const error = await runUnlessRateLimited(async () => {
      throw new RateLimitError();
    }).catch((caught: unknown) => caught);
    expect((error as Error).message).toBe('rate limit window used: the run cannot verify menu safety');
  });
});
