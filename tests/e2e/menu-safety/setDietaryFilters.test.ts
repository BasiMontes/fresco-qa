import { toDietaryPreferences } from '@schemas/profiles.types';
import { config, expect, test } from '@TestFixture';

test.describe('UI-TC-14: Free plan user edits diet and allergen filters', () => {
  test('UI-TC-14: should save a diet and an allergen without a paywall when the user is on the Free plan', async ({ test: fixture }) => {
    const { ui } = fixture;
    const api = fixture.api.asRole('alergia');

    const [, profile] = await api.profiles.getOwnProfile();
    const snapshot = toDietaryPreferences(profile);
    expect(snapshot.dieta_sin_lactosa, 'precondition: Sin lactosa is unset for alergia').toBe(false);
    expect(snapshot.alergenos, 'precondition: sesamo is unset for alergia').not.toContain('sesamo');

    let failure: unknown;
    try {
      await ui.login.goto();
      await ui.login.loginSuccessfully(config.auth.roleCredentials('alergia'));
      await ui.preferences.confirmFreePlan();
      await ui.preferences.goto();

      await ui.preferences.saveDietAndAllergenFiltersOnFreePlan({ diet: 'Sin lactosa', allergen: 'Sésamo' });
      await ui.preferences.expectChipsPersisted({ diet: 'Sin lactosa', allergen: 'Sésamo' });

      const [, saved] = await api.profiles.getOwnProfile();
      expect(saved.dieta_sin_lactosa, 'stored dieta_sin_lactosa').toBe(true);
      expect(saved.alergenos, 'stored alergenos').toContain('sesamo');
    }
    catch (error) {
      failure = error;
    }

    try {
      await api.profiles.restoreDietaryPreferences(snapshot);
      const [, restored] = await api.profiles.getOwnProfile();
      expect(toDietaryPreferences(restored), 'dietary preferences after restore').toEqual(snapshot);
    }
    catch (restoreError) {
      if (failure === undefined) {
        failure = restoreError;
      }
      else {
        test.info().annotations.push({ type: 'restore-failed', description: String(restoreError) });
      }
    }

    if (failure !== undefined) {
      throw failure;
    }
  });
});
