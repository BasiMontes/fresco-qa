import type { ProfilesApi } from '@api/ProfilesApi';

import { expect, test } from '@playwright/test';
import { toDietaryPreferences } from '@schemas/profiles.types';

export async function withDietaryPreferencesRestored(
  profiles: ProfilesApi,
  action: () => Promise<void>,
): Promise<void> {
  const [, profile] = await profiles.getOwnProfile();
  const snapshot = toDietaryPreferences(profile);

  let failure: unknown;
  try {
    await action();
  }
  catch (error) {
    failure = error;
  }

  try {
    await profiles.restoreDietaryPreferences(snapshot);
    const [, restored] = await profiles.getOwnProfile();
    expect(toDietaryPreferences(restored), 'dietary preferences after restore').toEqual(snapshot);
  }
  catch (restoreError) {
    if (failure === undefined) {
      failure = restoreError;
    }
    else {
      test.info().annotations.push({ type: 'restore-failed', description: String(restoreError) });
    }
  }

  if (failure !== undefined) {
    throw failure;
  }
}
