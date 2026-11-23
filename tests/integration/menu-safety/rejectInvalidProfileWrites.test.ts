import type { InvalidProfileWrite } from '@api/ProfilesApi';

import { test } from '@TestFixture';

const INVALID_WRITES: { reason: string, write: InvalidProfileWrite }[] = [
  { reason: 'the allergens are a string instead of a list', write: { patch: { alergenos: 'huevo' }, code: '22P02' } },
  { reason: 'a diet flag is not a boolean', write: { patch: { dieta_vegano: 'quizas' }, code: '22P02' } },
  { reason: 'the column does not exist', write: { patch: { columna_inexistente: 1 }, code: 'PGRST204' } },
];

test.describe('CHK-E5 CHK-E6: Invalid profile writes are rejected and change nothing', () => {
  test.use({ role: 'familia' });

  for (const { reason, write } of INVALID_WRITES) {
    test(`CHK-E5: should reject the update and keep the profile when ${reason}`, async ({ api }) => {
      await api.profiles.updateProfileWithInvalidValueIsRejected(write);
    });
  }

  test('CHK-E6: should reject the insert and keep the profile when the profile already exists', async ({ api }) => {
    await api.profiles.insertDuplicateProfileIsRejected();
  });
});
