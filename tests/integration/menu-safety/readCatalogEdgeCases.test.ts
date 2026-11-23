import { test } from '@TestFixture';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

test.describe('CHK-E1 CHK-E2 CHK-E3 CHK-E4: Catalogue reads at the edges', () => {
  test.use({ role: 'alergia' });

  test('CHK-E1: should return an empty list when the recipe id does not exist', async ({ api }) => {
    await api.recipes.readRecipeWithUnknownIdReturnsEmpty(UNKNOWN_ID);
  });

  test('CHK-E2: should reject the read when the recipe id is not a uuid', async ({ api }) => {
    await api.recipes.readRecipeWithMalformedIdIsRejected('not-a-uuid');
  });

  test('CHK-E3: should reject the read when the selected column does not exist', async ({ api }) => {
    await api.recipes.readUnknownColumnIsRejected('columna_inexistente');
  });

  test('CHK-E4: should answer not satisfiable when the requested range starts beyond the catalogue', async ({ api }) => {
    await api.recipes.readRecipesBeyondRangeIsNotSatisfiable();
  });
});
