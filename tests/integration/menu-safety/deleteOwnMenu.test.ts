import { expect, test } from '@TestFixture';
import { runUnlessRateLimited } from '@utils/quota';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

test.describe('CHK-E7 CHK-E8: Deleting menus', () => {
  test.use({ role: 'vegano' });

  test('CHK-E7: should delete nothing when the meal plan id does not exist', async ({ api }) => {
    await api.mealPlans.deleteUnknownMealPlanDeletesNothing(UNKNOWN_ID);
  });

  test('CHK-E8: should remove the plan and its slots when the owner deletes their menu', async ({ api }) => {
    const week = await api.mealPlans.findFreeWeek();

    try {
      await runUnlessRateLimited(async () => {
        await api.mealPlans.generateMenuForWeek(week);
        await api.mealPlans.deleteOwnMenuRemovesIt(week);
      });
    }
    finally {
      const leftovers = await api.mealPlans.deleteMenuForWeek(week);
      expect(leftovers, `menus for ${week.semana_iso} that could not be deleted`).toEqual([]);
    }
  });
});
