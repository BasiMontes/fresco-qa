import type { IsoWeek } from '@data/types';
import type { ApiFixture } from '@TestFixture';

import DataFactory from '@data/DataFactory';
import { config, expect, test } from '@TestFixture';
import { budgetWarningText, toCents } from '@utils/budgetWarning';
import { runUnlessRateLimited } from '@utils/quota';

const ROLE = 'presupuesto';
const LOW_BUDGET = 1;
const ONE_CENT = 0.01;

async function generateOverBudgetMenu(api: ApiFixture, week: IsoWeek): Promise<void> {
  expect(await api.mealPlans.deleteMenuForWeek(week), `earlier menus of ${ROLE} for ${week.semana_iso}`).toEqual([]);
  await api.profiles.setWeeklyBudget(LOW_BUDGET);
  await runUnlessRateLimited(async () => {
    await api.mealPlans.generateMenuForWeek(week);
  });
}

async function removeBudgetAndMenu(api: ApiFixture, week: IsoWeek | undefined): Promise<void> {
  if (week === undefined) {
    return;
  }
  try {
    await api.profiles.setWeeklyBudget(null);
  }
  finally {
    expect(await api.mealPlans.deleteMenuForWeek(week), `menus of ${ROLE} for ${week.semana_iso} that could not be deleted`).toEqual([]);
  }
}

async function expectStoredBudgetWarnings(api: ApiFixture, week: IsoWeek, warnings: string[]): Promise<void> {
  await expect.poll(
    async () => api.mealPlans.readStoredBudgetWarnings(week),
    { message: `stored budget warnings of ${week.semana_iso}` },
  ).toEqual(warnings);
}

test.describe('TC-17: A menu over the weekly budget shows a warning', () => {
  let week: IsoWeek | undefined;

  test.afterEach(async ({ test: fixture }) => {
    await removeBudgetAndMenu(fixture.api.asRole(ROLE), week);
    week = undefined;
  });

  test('UI-TC-17-1: should warn with cost minus budget on the menu and the calendar when the current week is over budget', async ({ test: fixture }) => {
    const { ui } = fixture;
    const api = fixture.api.asRole(ROLE);
    const drawn = DataFactory.currentIsoWeekInMadrid();
    week = drawn;

    await generateOverBudgetMenu(api, drawn);
    await ui.login.goto();
    await ui.login.loginSuccessfully(config.auth.roleCredentials(ROLE));

    await ui.menu.goto();
    const { cost, warning } = await ui.menu.showCurrentWeekBudgetWarning(LOW_BUDGET);
    await expectStoredBudgetWarnings(api, drawn, [warning]);
    await ui.calendar.openWeekWithMenu(drawn);
    await ui.calendar.expectBudgetWarning(warning);

    await api.profiles.setWeeklyBudget(cost);
    await ui.calendar.openWeekWithMenu(drawn);
    await ui.calendar.showNoBudgetWarningWhenCostFitsBudget();
    await expectStoredBudgetWarnings(api, drawn, []);
    await ui.menu.goto();
    await ui.menu.expectNoBudgetWarning();

    const justUnder = toCents(cost - ONE_CENT);
    await api.profiles.setWeeklyBudget(justUnder);
    await ui.calendar.openWeekWithMenu(drawn);
    await ui.calendar.expectBudgetWarning(budgetWarningText(ONE_CENT));
    await expectStoredBudgetWarnings(api, drawn, [budgetWarningText(ONE_CENT)]);
    await ui.menu.goto();
    const oneCentOver = await ui.menu.showCurrentWeekBudgetWarning(justUnder);
    expect(oneCentOver.warning).toBe(budgetWarningText(ONE_CENT));

    await test.info().attach('menu', { body: await fixture.page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  test('UI-TC-17-2: should warn in the calendar when the next week is over budget and its menu screen was never needed', async ({ test: fixture }) => {
    const { ui } = fixture;
    const api = fixture.api.asRole(ROLE);
    const drawn = DataFactory.nextIsoWeekInMadrid();
    week = drawn;

    await generateOverBudgetMenu(api, drawn);
    await ui.login.goto();
    await ui.login.loginSuccessfully(config.auth.roleCredentials(ROLE));

    await ui.calendar.openWeekWithMenu(drawn);
    const { cost, warning } = await ui.calendar.showUpcomingWeekBudgetWarning(LOW_BUDGET);
    await expectStoredBudgetWarnings(api, drawn, [warning]);

    await api.profiles.setWeeklyBudget(cost);
    await ui.calendar.openWeekWithMenu(drawn);
    await ui.calendar.showNoBudgetWarningWhenCostFitsBudget();
    await expectStoredBudgetWarnings(api, drawn, []);

    const justUnder = toCents(cost - ONE_CENT);
    await api.profiles.setWeeklyBudget(justUnder);
    await ui.calendar.openWeekWithMenu(drawn);
    const oneCentOver = await ui.calendar.showUpcomingWeekBudgetWarning(justUnder);
    expect(oneCentOver.warning).toBe(budgetWarningText(ONE_CENT));
    await expectStoredBudgetWarnings(api, drawn, [oneCentOver.warning]);

    await test.info().attach('calendar', { body: await fixture.page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
});
