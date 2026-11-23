import type { GenerateMealPlanPayload } from '@schemas/menu.types';

import { config, expect, test } from '@TestFixture';
import { runUnlessRateLimited } from '@utils/quota';
import { withDietaryPreferencesRestored } from '@utils/restoreProfile';

test.describe('UI-TC-05: Declaring lupin is accepted and the menu still generates', () => {
  test('UI-TC-05: should save altramuces and still generate a full menu when the profile declares lupin', async ({ test: fixture }) => {
    const { ui } = fixture;
    const api = fixture.api.asRole('vegano');

    const [, profile] = await api.profiles.getOwnProfile();
    expect(profile.alergenos, 'precondition: altramuces is unset for vegano').not.toContain('altramuces');
    const week: GenerateMealPlanPayload = await api.mealPlans.findFreeWeek();

    await withDietaryPreferencesRestored(api.profiles, async () => {
      try {
        await ui.login.goto();
        await ui.login.loginSuccessfully(config.auth.roleCredentials('vegano'));
        await ui.preferences.confirmFreePlan();
        await ui.preferences.goto();

        await ui.preferences.saveLupinAllergen();
        await ui.preferences.expectAllergenPersisted('Altramuces');

        const [, saved] = await api.profiles.getOwnProfile();
        expect(saved.alergenos, 'stored alergenos').toContain('altramuces');

        await runUnlessRateLimited(async () => {
          await api.mealPlans.generateMenuForWeek(week);
          const menu = await api.mealPlans.readMenuForWeek(week);
          expect(menu.rows, `stored slots for ${week.semana_iso}`).toHaveLength(21);
          expect(menu.rows.filter(row => row.recipes === null), `stored slots without recipe in ${week.semana_iso}`).toEqual([]);
          expect(
            menu.rows.filter(row => row.recipes?.alergenos.includes('altramuces')).map(row => row.recipes?.nombre),
            `recipes tagged altramuces in ${week.semana_iso}`,
          ).toEqual([]);
          expect(
            menu.rows.filter(row => row.recipes?.dieta.vegano !== true || row.recipes.dieta.sin_lactosa !== true).map(row => row.recipes?.nombre),
            `recipes not vegan and lactose-free in ${week.semana_iso}`,
          ).toEqual([]);
        });
      }
      finally {
        const leftovers = await api.mealPlans.deleteMenuForWeek(week);
        expect(leftovers, `menus of vegano for ${week.semana_iso} that could not be deleted`).toEqual([]);
      }
    });
  });
});
