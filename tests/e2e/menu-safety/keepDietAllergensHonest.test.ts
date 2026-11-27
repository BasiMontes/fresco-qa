import type { LoginPayload } from '@schemas/auth.types';
import type { ApiFixture } from '@TestFixture';

import DataFactory from '@data/DataFactory';
import { expect, test } from '@TestFixture';

function newAccount(): LoginPayload {
  const { email, password } = DataFactory.createUser();
  return { email, password };
}

interface StoredDiets {
  alergenos: string[]
  vegetariano: boolean
  vegano: boolean
  sinGluten: boolean
  sinLactosa: boolean
}

const NO_DIET = { vegetariano: false, vegano: false, sinGluten: false, sinLactosa: false };
const GENERATION_TEST_TIMEOUT = 150000;

async function signIn(api: ApiFixture, account: LoginPayload): Promise<void> {
  api.clearAuthToken();
  const session = await api.auth.signInWithPassword(account);
  api.setAuthToken(session.accessToken);
}

async function readStoredDiets(api: ApiFixture): Promise<StoredDiets> {
  const [, profile] = await api.profiles.getOwnProfile();
  return {
    alergenos: [...profile.alergenos].sort(),
    vegetariano: profile.dieta_vegetariano,
    vegano: profile.dieta_vegano,
    sinGluten: profile.dieta_sin_gluten,
    sinLactosa: profile.dieta_sin_lactosa,
  };
}

test.describe('TC-16: Diets add only the allergens they should', () => {
  test.describe.configure({ timeout: GENERATION_TEST_TIMEOUT });

  const rows = [
    { diets: ['Vegano', 'Sin lactosa'], allergens: ['Huevo', 'Pescado'], stored: { ...NO_DIET, alergenos: ['huevo', 'pescado'], vegetariano: true, vegano: true, sinLactosa: true } },
    { diets: ['Vegetariano'], allergens: ['Pescado'], stored: { ...NO_DIET, alergenos: ['pescado'], vegetariano: true } },
  ];

  for (const { diets, allergens, stored } of rows) {
    test(`UI-TC-16-1: should list and store only ${stored.alergenos.join(' and ')} when the diets are ${diets.join(' and ')}`, async ({ test: fixture }) => {
      const { ui, api } = fixture;
      const account = newAccount();

      await ui.onboarding.createAccountAndOpenDietStep(account);
      await ui.onboarding.showOnlyAllergensImpliedByDiets({ diets, allergens });
      await ui.onboarding.finishAndOpenMenu();

      await signIn(api, account);
      expect(await readStoredDiets(api), 'stored diets and allergens').toEqual(stored);
    });
  }

  test('UI-TC-16-2: should keep only the hand-chosen allergens when diets are switched on and off in the onboarding', async ({ test: fixture }) => {
    const { ui, api } = fixture;
    const account = newAccount();

    await ui.onboarding.createAccountAndOpenDietStep(account);
    await ui.onboarding.keepOnlyHandChosenAllergensWhenDietsAreSwitchedOff();
    await ui.onboarding.openSummary();
    await ui.onboarding.finishAndOpenMenu();

    await signIn(api, account);
    expect(await readStoredDiets(api), 'stored diets and allergens')
      .toEqual({ ...NO_DIET, alergenos: ['pescado', 'sulfitos'] });
  });

  test('UI-TC-16-3: should take back what a diet adds and keep a saved allergen when its diet is switched off in the preferences', async ({ test: fixture }) => {
    const { ui, api } = fixture;
    const account = newAccount();

    await ui.onboarding.createAccountAndOpenDietStep(account);
    await ui.onboarding.chooseDiets(['Vegetariano']);
    await ui.onboarding.openSummary();
    await ui.onboarding.finishAndOpenMenu();
    await ui.onboarding.skipFirstVisitTour();
    await signIn(api, account);
    expect(await readStoredDiets(api), 'precondition: saved vegetarian profile')
      .toEqual({ ...NO_DIET, alergenos: ['pescado'], vegetariano: true });

    await ui.preferences.goto();
    await ui.preferences.takeBackAllergenWhenTheDietThatAddedItIsSwitchedOff({ diet: 'Sin gluten', allergen: 'Gluten' });
    await ui.preferences.keepSavedAllergenWhenItsDietIsSwitchedOff({ diet: 'Vegetariano', allergen: 'Pescado' });

    expect(await readStoredDiets(api), 'stored diets and allergens')
      .toEqual({ ...NO_DIET, alergenos: ['pescado'] });
  });
});
