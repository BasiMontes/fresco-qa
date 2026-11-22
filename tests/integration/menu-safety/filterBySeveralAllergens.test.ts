import type { DietaryPreferences } from '@schemas/profiles.types';

import { DataFactory } from '@data/DataFactory';
import { expect, test } from '@TestFixture';
import { withDietaryPreferencesRestored } from '@utils/restoreProfile';
import { loadRoleState } from '@utils/roleState';

const rows: Array<{ title: string, allergens: string[] }> = [
  { title: 'should exclude huevo recipes when huevo is declared', allergens: ['huevo'] },
  { title: 'should exclude huevo and pescado recipes when both are declared', allergens: ['huevo', 'pescado'] },
  {
    title: 'should exclude all four allergens when huevo, pescado, frutos_de_cascara and soja are declared',
    allergens: ['huevo', 'pescado', 'frutos_de_cascara', 'soja'],
  },
  { title: 'should exclude pescado recipes when only pescado is declared', allergens: ['pescado'] },
  { title: 'should exclude frutos_de_cascara recipes when only frutos_de_cascara is declared', allergens: ['frutos_de_cascara'] },
  { title: 'should exclude soja recipes when only soja is declared', allergens: ['soja'] },
];

function preferencesWith(allergens: string[]): DietaryPreferences {
  return {
    alergenos: allergens,
    dieta_vegetariano: false,
    dieta_vegano: false,
    dieta_sin_gluten: false,
    dieta_sin_lactosa: false,
    dieta_sin_huevo: false,
    dieta_keto: false,
    dieta_halal: false,
  };
}

test.describe('TC-04: Several allergens exclude the union of all of them', () => {
  test.use({ role: 'familia' });

  for (const { title, allergens } of rows) {
    test(`TC-04: ${title}`, async ({ api }) => {
      const state = loadRoleState('familia');
      if (!state) {
        throw new Error('Role state for "familia" is missing: run the api-setup project.');
      }

      await api.mealPlans.expectNoMenusFromWeek(DataFactory.currentIsoWeekInMadrid());

      await withDietaryPreferencesRestored(api.profiles, async () => {
        await api.profiles.setDietaryPreferences(preferencesWith(allergens));

        const [, profile] = await api.profiles.getOwnProfile();
        expect([...profile.alergenos].sort(), 'stored allergens after the write').toEqual([...allergens].sort());
        expect(profile.ingredientes_odiados, 'disliked ingredients would also be filtered and break the comparison').toEqual([]);

        await api.recipes.getFilteredRecipesExcludeEveryDeclaredAllergen({ userId: state.userId, allergens });
      });
    });
  }
});
