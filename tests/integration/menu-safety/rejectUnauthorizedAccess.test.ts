import type { DeniedTable, EdgeFunctionName } from '@api/AccessControlApi';

import { test } from '@TestFixture';

const deniedTables: DeniedTable[] = ['user_profiles', 'meal_plans', 'meal_plan_recipes', 'user_consents'];
const edgeFunctions: EdgeFunctionName[] = ['generate-meal-plan', 'delete-account'];

test.describe('Requests without a valid session are denied', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ role: 'alergia' });

  test('CHK-U4: should read the public recipe catalog when there is no session', async ({ api }) => {
    api.clearAuthToken();
    await api.recipes.listCatalogWithoutSession();
  });

  for (const table of deniedTables) {
    test(`CHK-U1-1: should deny reading ${table} when there is no session`, async ({ api }) => {
      api.clearAuthToken();
      await api.access.readPrivateTableWithoutSessionIsDenied(table);
    });
  }

  test('CHK-U1-2: should deny calling get_filtered_recipes when there is no session', async ({ api }) => {
    api.clearAuthToken();
    await api.access.callFilterRpcWithoutSessionIsDenied();
  });

  for (const functionName of edgeFunctions) {
    test(`CHK-U1-3: should deny calling ${functionName} when there is no session`, async ({ api }) => {
      api.clearAuthToken();
      await api.access.callEdgeFunctionWithoutSessionIsDenied(functionName);
    });
  }

  test('CHK-C1-1: should deny reading user_profiles when the token is tampered', async ({ api }) => {
    await api.access.readPrivateTableWithTamperedTokenIsDenied();
  });

  test('CHK-C1-2: should deny calling generate-meal-plan when the token is tampered', async ({ api }) => {
    await api.access.callEdgeFunctionWithTamperedTokenIsDenied();
  });
});
