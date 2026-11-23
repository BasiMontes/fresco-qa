import { toDietaryPreferences } from '@schemas/profiles.types';
import { expect, test } from '@TestFixture';
import { runUnlessRateLimited } from '@utils/quota';
import { withDietaryPreferencesRestored } from '@utils/restoreProfile';

test.describe('TC-01 TC-02 TC-03 TC-10 CHK-D3: Generated menus respect the stored profile', () => {
  test.afterEach(async ({ api }) => {
    const leftovers = await api.mealPlans.cleanupMenus(api.mealPlans.createdPlanIds());
    expect(leftovers, 'menus created by this test that could not be deleted').toEqual([]);
  });

  test.describe('egg-allergic persona', () => {
    test.use({ role: 'alergia' });

    test('TC-01: should generate egg-free menus and reject a repeated week when the profile is egg-allergic', { tag: ['@critical'] }, async ({ api }) => {
      const [, profile] = await api.profiles.getOwnProfile();
      expect(profile.alergenos, 'persona alergia must store the allergen huevo').toContain('huevo');

      const firstWeek = await api.mealPlans.findFreeWeek();

      await test.step(`TC-01: generate an egg-free menu for ${firstWeek.semana_iso}`, async () => {
        await runUnlessRateLimited(async () => api.mealPlans.generateMenuForEggAllergicProfile(firstWeek));
      });

      await test.step(`CHK-D3: reject a second request for ${firstWeek.semana_iso}`, async () => {
        await runUnlessRateLimited(async () => api.mealPlans.generateMenuForExistingWeekReturnsConflict(firstWeek));
      });

      await test.step(`TC-10: add an allergen after ${firstWeek.semana_iso} was generated`, async () => {
        const before = await api.mealPlans.readMenuForWeek(firstWeek);
        const allergen = api.mealPlans.allergenToAddAfterGeneration(before, profile.alergenos);
        await withDietaryPreferencesRestored(api.profiles, async () => {
          await api.profiles.setDietaryPreferences({ ...toDietaryPreferences(profile), alergenos: [...profile.alergenos, allergen] });
          await api.mealPlans.addAllergenAfterGenerationRetiresConflictingSlots({ week: firstWeek, allergen, before });
        });
      });

      const secondWeek = await api.mealPlans.findFreeWeek();

      await test.step('TC-02 control: the catalogue contains the recipe Ensalada cesar', async () => {
        const [, recipes] = await api.recipes.listCatalogRecipesNamed('Ensalada cesar');
        expect(recipes.length, 'recipe Ensalada cesar is missing: the F-02 name check would be vacuous').toBeGreaterThanOrEqual(1);
      });

      await test.step(`TC-02: generate an egg-free menu for ${secondWeek.semana_iso}`, async () => {
        await runUnlessRateLimited(async () => api.mealPlans.generateMenuOnAnotherWeekStaysEggFree(secondWeek));
      });
    });
  });

  test.describe('vegan lactose-free persona', () => {
    test.use({ role: 'vegano' });

    test('TC-03: should generate a vegan and lactose-free menu when the profile has both diets', { tag: ['@critical'] }, async ({ api }) => {
      const [, profile] = await api.profiles.getOwnProfile();
      expect(profile.dieta_vegano, 'persona vegano must have dieta_vegano').toBe(true);
      expect(profile.dieta_sin_lactosa, 'persona vegano must have dieta_sin_lactosa').toBe(true);

      const week = await api.mealPlans.findFreeWeek();

      await test.step(`TC-03: generate a vegan lactose-free menu for ${week.semana_iso}`, async () => {
        await runUnlessRateLimited(async () => api.mealPlans.generateMenuForVeganLactoseFreeProfile({ week, allergens: profile.alergenos }));
      });
    });
  });
});
