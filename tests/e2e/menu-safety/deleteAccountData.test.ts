import type { UserData } from '@api/ErasureApi';
import type { LoginPayload } from '@schemas/auth.types';
import type { ApiFixture, TestFixture } from '@TestFixture';

import DataFactory from '@data/DataFactory';
import { config, expect, test } from '@TestFixture';

const GENERATION_TEST_TIMEOUT = 150000;
const DECLARED_ALLERGEN = 'Frutos de cáscara';
const STORED_ALLERGEN = 'frutos_de_cascara';

function newAccount(): LoginPayload {
  const { email, password } = DataFactory.createUser();
  return { email, password };
}

async function finishOnboardingWithAnAllergy({ ui }: TestFixture): Promise<string> {
  await ui.onboarding.chooseAllergen(DECLARED_ALLERGEN);
  await ui.onboarding.openSummary();
  return ui.onboarding.finishAndOpenMenu();
}

async function readStoredData(api: ApiFixture, accountId: string): Promise<UserData> {
  const data = await api.erasure.readUserData(accountId);
  expect(data.profiles, 'precondition: stored profile with the declared allergy')
    .toEqual([{ id: accountId, alergenos: [STORED_ALLERGEN] }]);
  expect(data.menus.length, 'precondition: stored menu').toBeGreaterThan(0);
  expect(data.consents.map(consent => consent.kind), 'precondition: stored health-data consent').toContain('health_data');
  expect(await api.erasure.readErasureRecords(accountId), 'precondition: no erasure record yet').toEqual([]);
  return data;
}

async function expectErasedData(api: ApiFixture, accountId: string): Promise<void> {
  expect(await api.erasure.readUserData(accountId), 'rows left after the deletion')
    .toEqual({ profiles: [], menus: [], consents: [] });
  expect(await api.erasure.readErasureRecords(accountId), 'erasure records under the hash of the account id')
    .toEqual([{ stripe: 'none', posthog: 'failed', pending_posthog_distinct_id: accountId }]);
}

test.describe('TC-12: Deleting the account removes the health data', () => {
  test.describe.configure({ timeout: GENERATION_TEST_TIMEOUT });

  test.beforeAll(() => {
    expect(config.auth.supabaseServiceRoleKey.length, 'service role key of the local stack').toBeGreaterThan(0);
  });

  test('UI-TC-12-1: should remove the account and its data when a registered person confirms with email and password', async ({ test: fixture }) => {
    const { ui, api } = fixture;
    const account = newAccount();

    await ui.onboarding.createAccountAndOpenDietStep(account);
    const accountId = await finishOnboardingWithAnAllergy(fixture);
    await ui.onboarding.skipFirstVisitTour();
    await readStoredData(api, accountId);

    await ui.profile.openDeleteAccountDialog();
    await ui.profile.deleteRegisteredAccount(account);

    await expectErasedData(api, accountId);
    api.clearAuthToken();
    await api.auth.expectSignInRejected(account);
  });

  test('UI-TC-12-2: should remove the account and its data when a guest confirms with the fixed phrase', async ({ test: fixture }) => {
    const { ui, api } = fixture;

    await ui.onboarding.continueAsGuestAndOpenDietStep();
    const accountId = await finishOnboardingWithAnAllergy(fixture);
    await readStoredData(api, accountId);

    await ui.profile.openDeleteAccountDialog();
    await ui.profile.deleteGuestAccount();

    await expectErasedData(api, accountId);
  });

  test('UI-TC-12-3: should keep the account and its data when the password is wrong', async ({ test: fixture }) => {
    const { ui, api } = fixture;
    const account = newAccount();

    await ui.onboarding.createAccountAndOpenDietStep(account);
    const accountId = await finishOnboardingWithAnAllergy(fixture);
    await ui.onboarding.skipFirstVisitTour();
    const before = await readStoredData(api, accountId);

    await ui.profile.openDeleteAccountDialog();
    await ui.profile.keepAccountWhenPasswordIsWrong({ email: account.email, password: newAccount().password });

    expect(await api.erasure.readUserData(accountId), 'data after the refused deletion').toEqual(before);
    expect(await api.erasure.readErasureRecords(accountId), 'erasure records after the refused deletion').toEqual([]);
  });
});
