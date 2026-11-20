import type { Household } from '@schemas/profiles.types';

import { FAMILIA_BASELINE } from '@data/personas';
import { toHousehold } from '@schemas/profiles.types';
import { expect, test } from '@TestFixture';

const withinLimits: Household[] = [
  { num_personas: 1, adultos: 1, ninos: 0 },
  { num_personas: 10, adultos: 10, ninos: 0 },
];

const outsideLimits: Array<{ household: Household, reason: string }> = [
  { household: { num_personas: 11, adultos: 10, ninos: 1 }, reason: 'num_personas is above 10' },
  { household: { num_personas: 0, adultos: 0, ninos: 0 }, reason: 'num_personas is below 1' },
  { household: { num_personas: 2, adultos: 3, ninos: 0 }, reason: 'adultos exceeds num_personas' },
  { household: { num_personas: 1, adultos: 0, ninos: 1 }, reason: 'adultos is below 1' },
  { household: { num_personas: 1, adultos: 1, ninos: -1 }, reason: 'ninos is negative' },
];

function label({ num_personas, adultos, ninos }: Household): string {
  return `${num_personas}/${adultos}/${ninos}`;
}

test.describe('TC-08: Household size limits are enforced', () => {
  test.use({ role: 'familia' });

  test.beforeEach(async ({ api }) => {
    await api.profiles.restoreHousehold(FAMILIA_BASELINE);
  });

  test.afterEach(async ({ api }) => {
    await api.profiles.restoreHousehold(FAMILIA_BASELINE);
    const [, profile] = await api.profiles.getOwnProfile();
    expect(toHousehold(profile)).toEqual(FAMILIA_BASELINE);
  });

  for (const household of withinLimits) {
    test(`TC-08-1: should accept household ${label(household)} when within limits`, async ({ api }) => {
      await api.profiles.updateHouseholdWithinLimits(household);
    });
  }

  for (const { household, reason } of outsideLimits) {
    test(`TC-08-2: should reject household ${label(household)} when ${reason}`, async ({ api }) => {
      await api.profiles.updateHouseholdOutsideLimits(household);
    });
  }
});
