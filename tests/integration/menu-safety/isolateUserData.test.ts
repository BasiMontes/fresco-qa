import type { PrivateTable } from '@api/AccessControlApi';
import type { AuthRole } from '@variables';

import { toHousehold } from '@schemas/profiles.types';
import { expect, test } from '@TestFixture';
import { runUnlessRateLimited } from '@utils/quota';
import { loadRoleState } from '@utils/roleState';

const victims: AuthRole[] = ['vegano', 'familia'];
const tables: PrivateTable[] = ['user_profiles', 'meal_plans', 'user_consents'];

function victimId(role: AuthRole): string {
  const state = loadRoleState(role);
  if (!state) {
    throw new Error(`Role state for "${role}" is missing: run the api-setup project.`);
  }
  return state.userId;
}

test.describe('CHK-A1: A user lists only their own profile', () => {
  test.use({ role: 'alergia' });

  test('CHK-A1: should list exactly one profile row when the caller lists user_profiles', async ({ api }) => {
    await api.profiles.listOwnProfilesReturnsOnlyOwnRow();
  });
});

test.describe('CHK-A2: A user cannot read the rows of another user', () => {
  test.use({ role: 'alergia' });

  for (const table of tables) {
    for (const victim of victims) {
      test(`CHK-A2: should read no ${table} rows of ${victim} when the victim own rows exist`, async ({ api }) => {
        const ownerId = victimId(victim);
        const victimApi = api.asRole(victim);

        try {
          if (table === 'meal_plans') {
            const week = await victimApi.mealPlans.findFreeWeek();
            await runUnlessRateLimited(async () => victimApi.mealPlans.generateMenuForWeek(week));
          }

          await victimApi.access.readOwnRowsReturnsRows({ table, ownerId, persona: victim });
          await api.access.readOtherUsersRowsReturnsEmpty({ table, ownerId });
        }
        finally {
          const leftovers = await victimApi.mealPlans.cleanupMenus(victimApi.mealPlans.createdPlanIds());
          expect(leftovers, `menus of ${victim} created by this test that could not be deleted`).toEqual([]);
        }
      });
    }
  }
});

test.describe('CHK-A5: A user cannot update the profile of another user', () => {
  test.use({ role: 'alergia' });

  for (const victim of victims) {
    test(`CHK-A5: should change nothing in the profile of ${victim} when the caller patches it`, async ({ api }) => {
      const victimApi = api.asRole(victim);
      const [, before] = await victimApi.profiles.getOwnProfile();

      await api.profiles.updateOtherUsersProfileChangesNothing(victimId(victim), toHousehold(before));

      const [, after] = await victimApi.profiles.getOwnProfile();
      expect(toHousehold(after)).toEqual(toHousehold(before));
      expect(after.alergenos).toEqual(before.alergenos);
    });
  }
});
