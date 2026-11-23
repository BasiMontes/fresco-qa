import { test } from '@TestFixture';

test.describe('CHK-E9: A menu cannot be created by writing the table directly', () => {
  test.use({ role: 'familia' });

  test('CHK-E9: should deny the insert and create no plan when the caller writes meal_plans through REST', async ({ api }) => {
    const [, profile] = await api.profiles.getOwnProfile();
    const week = await api.mealPlans.findFreeWeek();

    await api.mealPlans.insertMealPlanDirectlyIsDenied({ userId: profile.id, week });
  });
});
