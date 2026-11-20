import type { GenerateMealPlanPayload } from '@schemas/menu.types';

import { DataFactory } from '@data/DataFactory';
import { expect, test } from '@TestFixture';
import { runUnlessRateLimited } from '@utils/quota';

const validWeek = DataFactory.futureIsoWeek(3);

const missingFieldRows: Array<{ name: string, payload: Partial<GenerateMealPlanPayload> }> = [
  { name: 'the body is empty', payload: {} },
  { name: 'the body has no fecha_inicio', payload: { semana_iso: validWeek.semana_iso } },
];

const invalidWeekRows = ['2026-W99', '2026-W00'];

test.describe('CHK-D1 CHK-D2: Invalid menu requests are rejected', () => {
  test.use({ role: 'familia' });

  test.afterEach(async ({ api }) => {
    const leftovers = await api.mealPlans.cleanupMenus(api.mealPlans.createdPlanIds());
    expect(leftovers, 'menus wrongly created by an invalid request that could not be deleted').toEqual([]);
  });

  for (const { name, payload } of missingFieldRows) {
    test(`CHK-D1: should reject with 400 when ${name}`, async ({ api }) => {
      await runUnlessRateLimited(async () => api.mealPlans.generateMenuWithMissingFields(payload));
    });
  }

  for (const semana_iso of invalidWeekRows) {
    test(`CHK-D2: should reject with 400 when the week is ${semana_iso}`, async ({ api }) => {
      await runUnlessRateLimited(async () => api.mealPlans.generateMenuWithInvalidWeek({ semana_iso, fecha_inicio: validWeek.fecha_inicio }));
    });
  }
});
