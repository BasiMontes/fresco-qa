import type { GenerateMealPlanPayload } from '@schemas/menu.types';
import type { TestFixture } from '@TestFixture';
import type { AuthRole } from '@variables';

import { config, expect, test } from '@TestFixture';
import { runUnlessRateLimited } from '@utils/quota';

async function deleteCreatedMenu(fixture: TestFixture, role: AuthRole, week: GenerateMealPlanPayload | undefined): Promise<void> {
  if (week === undefined) {
    return;
  }
  const leftovers = await fixture.api.asRole(role).mealPlans.deleteMenuForWeek(week);
  expect(leftovers, `menus of ${role} for ${week.semana_iso} that could not be deleted`).toEqual([]);
}

test.describe('UI-TC-01: Egg-allergic persona generates a menu from the calendar', () => {
  let week: GenerateMealPlanPayload | undefined;

  test.afterEach(async ({ test: fixture }) => {
    await deleteCreatedMenu(fixture, 'alergia', week);
  });

  test('UI-TC-01: should show 21 egg-free dishes when the profile declares egg allergy', { tag: ['@critical'] }, async ({ test: fixture }) => {
    const { ui } = fixture;
    const api = fixture.api.asRole('alergia');

    const [, profile] = await api.profiles.getOwnProfile();
    expect(profile.alergenos, 'persona alergia must store the allergen huevo').toContain('huevo');
    const drawn = await api.mealPlans.findFreeWeek();
    week = drawn;

    await ui.login.goto();
    await ui.login.loginSuccessfully(config.auth.roleCredentials('alergia'));
    await ui.calendar.goto(drawn);

    let slotNames: Record<string, string> = {};
    await runUnlessRateLimited(async () => {
      slotNames = await ui.calendar.generateMenuForEggAllergicPersona(drawn);
    });

    const menu = await api.mealPlans.readMenuForWeek(drawn);
    expect(menu.rows, `stored slots for ${drawn.semana_iso}`).toHaveLength(21);
    expect(menu.rows.filter(row => row.recipes === null), `stored slots without recipe in ${drawn.semana_iso}`).toEqual([]);
    expect(
      menu.rows.filter(row => row.recipes?.alergenos.includes('huevo')).map(row => row.recipes?.nombre),
      `recipes tagged huevo in ${drawn.semana_iso}`,
    ).toEqual([]);
    expect(
      Object.values(slotNames).sort(),
      `calendar names against stored names in ${drawn.semana_iso}`,
    ).toEqual(menu.rows.map(row => row.recipes?.nombre).sort());

    await test.info().attach('calendar', { body: await fixture.page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
});

test.describe('UI-TC-03: Vegan lactose-free persona generates a menu from the calendar', () => {
  let week: GenerateMealPlanPayload | undefined;

  test.afterEach(async ({ test: fixture }) => {
    await deleteCreatedMenu(fixture, 'vegano', week);
  });

  test('UI-TC-03: should show 21 vegan lactose-free dishes when both diets are active', { tag: ['@critical'] }, async ({ test: fixture }) => {
    const { ui } = fixture;
    const api = fixture.api.asRole('vegano');

    const [, profile] = await api.profiles.getOwnProfile();
    expect(profile.dieta_vegano, 'persona vegano must have dieta_vegano').toBe(true);
    expect(profile.dieta_sin_lactosa, 'persona vegano must have dieta_sin_lactosa').toBe(true);
    const drawn = await api.mealPlans.findFreeWeek();
    week = drawn;

    await ui.login.goto();
    await ui.login.loginSuccessfully(config.auth.roleCredentials('vegano'));
    await ui.calendar.goto(drawn);

    let slotNames: Record<string, string> = {};
    await runUnlessRateLimited(async () => {
      slotNames = await ui.calendar.generateMenuForVeganLactoseFreePersona(drawn);
    });

    const menu = await api.mealPlans.readMenuForWeek(drawn);
    expect(menu.rows, `stored slots for ${drawn.semana_iso}`).toHaveLength(21);
    expect(menu.rows.filter(row => row.recipes === null), `stored slots without recipe in ${drawn.semana_iso}`).toEqual([]);
    expect(
      menu.rows.filter(row => row.recipes?.dieta.vegano !== true || row.recipes.dieta.sin_lactosa !== true).map(row => row.recipes?.nombre),
      `recipes not vegan and lactose-free in ${drawn.semana_iso}`,
    ).toEqual([]);
    expect(
      menu.rows.filter(row => profile.alergenos.some(allergen => row.recipes?.alergenos.includes(allergen))).map(row => row.recipes?.nombre),
      `recipes carrying a stored allergen in ${drawn.semana_iso}`,
    ).toEqual([]);
    expect(
      Object.values(slotNames).sort(),
      `calendar names against stored names in ${drawn.semana_iso}`,
    ).toEqual(menu.rows.map(row => row.recipes?.nombre).sort());

    await test.info().attach('calendar', { body: await fixture.page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
});

test.describe('UI-TC-11: Family persona generates a full week from the calendar', () => {
  let week: GenerateMealPlanPayload | undefined;

  test.afterEach(async ({ test: fixture }) => {
    await deleteCreatedMenu(fixture, 'familia', week);
  });

  test('UI-TC-11: should show 21 slots with no repeated comida or cena when the profile has no restriction', async ({ test: fixture }) => {
    const { ui } = fixture;
    const api = fixture.api.asRole('familia');

    const drawn = await api.mealPlans.findFreeWeek();
    week = drawn;

    await ui.login.goto();
    await ui.login.loginSuccessfully(config.auth.roleCredentials('familia'));
    await ui.calendar.goto(drawn);

    await runUnlessRateLimited(async () => {
      await ui.calendar.generateFullWeekWithoutRepeatedMeals(drawn);
    });

    const menu = await api.mealPlans.readMenuForWeek(drawn);
    expect(menu.rows, `stored slots for ${drawn.semana_iso}`).toHaveLength(21);
    expect(menu.rows.filter(row => row.recipes === null), `stored slots without recipe in ${drawn.semana_iso}`).toEqual([]);
    const storedMainMeals = menu.rows.filter(row => row.tipo_plato === 'comida' || row.tipo_plato === 'cena');
    expect(storedMainMeals, `stored comida and cena slots in ${drawn.semana_iso}`).toHaveLength(14);
    expect(new Set(storedMainMeals.map(row => row.recipe_id)).size, `distinct stored comida and cena recipes in ${drawn.semana_iso}`).toBe(14);
  });
});
