import { expect, test } from '@TestFixture';
import { loadRoleState } from '@utils/roleState';

function userIdOf(role: 'alergia' | 'vegano'): string {
  const state = loadRoleState(role);
  if (!state) {
    throw new Error(`Role state for "${role}" is missing: run the api-setup project.`);
  }
  return state.userId;
}

test.describe('CHK-B2-1: Filtered recipes exclude the declared allergens', () => {
  test.use({ role: 'alergia' });

  test('CHK-B2-1: should return no recipe with a declared allergen when the persona is alergia', async ({ api }) => {
    const [, profile] = await api.profiles.getOwnProfile();
    expect(profile.alergenos, 'persona alergia must store the allergen huevo').toContain('huevo');

    const [, tagged] = await api.recipes.listCatalogTaggedWithAllergen('huevo');
    expect(tagged.length, 'the catalogue holds no recipe tagged huevo: the exclusion check would be vacuous').toBeGreaterThan(0);

    await api.recipes.getFilteredRecipesExcludeDeclaredAllergens({ userId: userIdOf('alergia'), allergens: profile.alergenos });
  });

  test('CHK-B2-1: should return no recipe with a declared allergen when the persona is vegano', async ({ api }) => {
    const veganApi = api.asRole('vegano');
    const [, profile] = await veganApi.profiles.getOwnProfile();

    await veganApi.recipes.getFilteredRecipesExcludeDeclaredAllergens({ userId: userIdOf('vegano'), allergens: profile.alergenos });
  });
});

test.describe('CHK-B2-2: Filtered recipes match the declared diet', () => {
  test.use({ role: 'alergia' });

  test('CHK-B2-2: should return only vegan lactose-free recipes when the persona is vegano', async ({ api }) => {
    const veganApi = api.asRole('vegano');
    const [, profile] = await veganApi.profiles.getOwnProfile();
    expect(profile.dieta_vegano, 'persona vegano must store dieta_vegano').toBe(true);
    expect(profile.dieta_sin_lactosa, 'persona vegano must store dieta_sin_lactosa').toBe(true);

    await veganApi.recipes.getFilteredRecipesMatchDeclaredDiet({ userId: userIdOf('vegano'), diet: ['vegano', 'sin_lactosa'] });
  });
});

test.describe('TC-15: Filtering with the profile of another user is rejected', () => {
  test.use({ role: 'alergia' });

  test('TC-15: should reject filtering recipes when the profile belongs to another user', { tag: ['@critical'] }, async ({ api }) => {
    await api.recipes.getFilteredRecipesForAnotherUserRejected(userIdOf('vegano'));
  });
});
