import type { z } from 'zod';

import { expect } from '@playwright/test';
import { prettifyError } from 'zod';

export function expectMatchesSchema<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  expect(result.success, `${label} does not match its schema: ${result.success ? '' : prettifyError(result.error)}`).toBe(true);
  return result.data as T;
}
