import { expect, test } from '@TestFixture';

test.describe('CHK-S1: The stored profile matches its schema', () => {
  test.use({ role: 'alergia' });

  test('CHK-S1: should return a profile row with every contract field when the caller reads their own profile', async ({ api }) => {
    const [, profile] = await api.profiles.readOwnProfileMatchesSchema();

    expect(profile.alergenos, 'persona alergia must store the allergen huevo').toContain('huevo');
  });
});

test.describe('CHK-S2: The recipe catalogue matches its schema', () => {
  test.use({ role: 'alergia' });

  test('CHK-S2: should return recipe rows with every contract field when the caller reads the active catalogue', async ({ api }) => {
    const [, recipes] = await api.recipes.readCatalogRecipesMatchSchema();

    expect(recipes.every(recipe => recipe.activo), 'every row of the active catalogue is active').toBe(true);
  });
});
