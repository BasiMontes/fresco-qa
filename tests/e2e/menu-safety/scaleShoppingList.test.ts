import type { IsoWeek } from '@data/types';
import type { Household } from '@schemas/profiles.types';
import type { ShoppingAisle } from '@schemas/shopping.types';
import type { ApiFixture, UiFixture } from '@TestFixture';

import DataFactory from '@data/DataFactory';
import { FAMILIA_BASELINE } from '@data/personas';
import { toHousehold } from '@schemas/profiles.types';
import { config, expect, test } from '@TestFixture';
import { runUnlessRateLimited } from '@utils/quota';
import { aisleProblems, commonIngredientsListed } from '@utils/shoppingAisles';
import { baseQuantities, expectedScreen, rowsOutOfProportion, rowsThatWouldExposeAnUnscaledList } from '@utils/shoppingScale';

const ROLE = 'presupuesto';
const ONE_PERSON: Household = { num_personas: 1, adultos: 1, ninos: 0 };
const TEN_PEOPLE: Household = { num_personas: 10, adultos: 10, ninos: 0 };

interface ListRequest {
  api: ApiFixture
  ui: UiFixture
  planId: string
  household: Household
}

async function generateListFor({ api, ui, planId, household }: ListRequest): Promise<ShoppingAisle[]> {
  await api.profiles.setHousehold(household);
  await api.shoppingLists.deleteListOfPlan(planId);
  await ui.shoppingList.openGeneratedList();
  const [, lists] = await api.shoppingLists.listsOfPlan(planId);
  expect(lists, `shopping lists of plan ${planId} for ${household.num_personas} people`).toHaveLength(1);
  await ui.shoppingList.showStoredRowsGroupedByAisle(expectedScreen(lists[0].items));
  return lists[0].items;
}

test.describe('TC-07: Shopping list quantities scale with household size', () => {
  let pending: { week: IsoWeek, household: Household } | undefined;

  test.afterEach(async ({ test: fixture }) => {
    if (pending === undefined) {
      return;
    }
    const { week, household } = pending;
    pending = undefined;
    const api = fixture.api.asRole(ROLE);
    try {
      await api.profiles.setHousehold(household);
    }
    finally {
      expect(await api.mealPlans.deleteMenuForWeek(week), `menus of ${ROLE} for ${week.semana_iso} that could not be deleted`).toEqual([]);
    }
  });

  test('UI-TC-07-1: should keep the same grouped ingredients and multiply their quantities when one menu is listed for 1, 4 and 10 people', async ({ test: fixture }) => {
    const { ui } = fixture;
    const api = fixture.api.asRole(ROLE);
    const week = DataFactory.currentIsoWeekInMadrid();
    const [, profile] = await api.profiles.getOwnProfile();
    pending = { week, household: toHousehold(profile) };

    expect(await api.mealPlans.deleteMenuForWeek(week), `earlier menus of ${ROLE} for ${week.semana_iso}`).toEqual([]);
    await api.profiles.setHousehold(ONE_PERSON);
    await runUnlessRateLimited(async () => {
      await api.mealPlans.generateMenuForWeek(week);
    });
    const menu = await api.mealPlans.readMenuForWeek(week);
    await ui.login.goto();
    await ui.login.loginSuccessfully(config.auth.roleCredentials(ROLE));

    const baseline = await generateListFor({ api, ui, planId: menu.planId, household: ONE_PERSON });
    expect(commonIngredientsListed(baseline), 'positive control: ingredients whose aisle the test knows').toBeGreaterThan(0);
    expect(aisleProblems(baseline), 'aisle grouping of the list').toEqual([]);
    const single = baseQuantities(baseline);
    expect(rowsThatWouldExposeAnUnscaledList(single), 'positive control: rows that would expose an unscaled list').toBeGreaterThan(0);

    const listsByPeople = new Map([[ONE_PERSON.num_personas, single]]);
    for (const household of [FAMILIA_BASELINE, TEN_PEOPLE]) {
      const people = household.num_personas;
      const scaled = baseQuantities(await generateListFor({ api, ui, planId: menu.planId, household }));
      expect([...scaled.keys()].sort(), `aisles, ingredients and units for ${people} people`).toEqual([...single.keys()].sort());
      listsByPeople.set(people, scaled);
    }
    expect(rowsOutOfProportion(listsByPeople), 'quantities out of proportion to the number of people').toEqual([]);

    const after = await api.mealPlans.readMenuForWeek(week);
    expect(after.rows.map(row => `${row.id} ${row.recipe_id}`).sort(), 'every list came from the same recipes')
      .toEqual(menu.rows.map(row => `${row.id} ${row.recipe_id}`).sort());

    await test.info().attach('shopping-list', { body: await fixture.page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
});
