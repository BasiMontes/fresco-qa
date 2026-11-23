import DataFactory from '@data/DataFactory';
import { config, expect, test } from '@TestFixture';
import { runUnlessRateLimited } from '@utils/quota';
import { withDietaryPreferencesRestored } from '@utils/restoreProfile';

const NO_DIET = {
  dieta_vegetariano: false,
  dieta_vegano: false,
  dieta_sin_gluten: false,
  dieta_sin_lactosa: false,
  dieta_sin_huevo: false,
  dieta_keto: false,
  dieta_halal: false,
};

test.describe('UI-TC-09: Adding a recipe from the library replaces one open slot', () => {
  test('UI-TC-09: should change only the chosen slot and keep it egg-free when a safe recipe is added from the library', async ({ test: fixture }) => {
    const { ui } = fixture;
    const api = fixture.api.asRole('familia');
    const week = DataFactory.currentIsoWeekInMadrid();

    await api.mealPlans.expectNoMenusFromWeek(week);
    const [, profile] = await api.profiles.getOwnProfile();

    await withDietaryPreferencesRestored(api.profiles, async () => {
      try {
        await api.profiles.setDietaryPreferences({ ...NO_DIET, alergenos: ['huevo'] });

        await runUnlessRateLimited(async () => {
          await api.mealPlans.generateMenuForWeek(week);
          const before = await api.mealPlans.readMenuForWeek(week);
          expect(before.rows, `stored slots for ${week.semana_iso} before the change`).toHaveLength(21);

          const [, safeLunches] = await api.recipes.listSafeRecipesOfType({ userId: profile.id, type: 'comida' });
          const inMenu = new Set(before.rows.map(row => row.recipe_id));
          const nameCount = new Map<string, number>();
          for (const recipe of safeLunches) {
            nameCount.set(recipe.nombre, (nameCount.get(recipe.nombre) ?? 0) + 1);
          }
          const chosen = safeLunches.find(recipe => nameCount.get(recipe.nombre) === 1 && !inMenu.has(recipe.id));
          expect(chosen, `a safe comida recipe with a unique name outside the menu of ${week.semana_iso}`).toBeDefined();
          expect(chosen?.alergenos, 'precondition: the chosen recipe carries no huevo').not.toContain('huevo');

          await ui.login.goto();
          await ui.login.loginSuccessfully(config.auth.roleCredentials('familia'));
          const replacedName = await ui.recipes.replaceOpenMealSlotFromLibrary({ name: chosen?.nombre ?? '' });

          const after = await api.mealPlans.readMenuForWeek(week);
          expect(after.rows, `stored slots for ${week.semana_iso} after the change`).toHaveLength(21);
          expect(after.rows.map(row => row.id).sort(), 'slot ids are unchanged').toEqual(before.rows.map(row => row.id).sort());

          const beforeById = new Map(before.rows.map(row => [row.id, row]));
          const changed = after.rows.filter(row => row.recipe_id !== beforeById.get(row.id)?.recipe_id);
          expect(changed, `slots whose recipe changed in ${week.semana_iso}`).toHaveLength(1);
          expect(changed[0].tipo_plato, 'type of the changed slot').toBe('comida');
          expect(changed[0].recipe_id, 'recipe stored in the changed slot').toBe(chosen?.id);
          expect(beforeById.get(changed[0].id)?.recipes?.nombre, 'previous recipe of the changed slot against the dialog text').toBe(replacedName);
          expect(changed[0].recipes?.alergenos, 'allergens of the stored recipe').not.toContain('huevo');
        });
      }
      finally {
        const leftovers = await api.mealPlans.deleteMenuForWeek(week);
        expect(leftovers, `menus of familia for ${week.semana_iso} that could not be deleted`).toEqual([]);
      }
    });
  });
});
