import type { APIResponse } from '@playwright/test';
import type { GenerateMealPlanPayload, GenerateMealPlanResponse, MealPlan } from '@schemas/menu.types';
import type { Recipe } from '@schemas/recipes.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { DataFactory } from '@data/DataFactory';
import { expect } from '@playwright/test';
import { atc, step } from '@utils/decorators';
import { RateLimitError } from '@utils/quota';

export interface MenuRecipeRow {
  id: string
  recipe_id: string | null
  dia: string | number
  tipo_plato: string
  recipes: Pick<Recipe, 'nombre' | 'alergenos' | 'dieta'> | null
}

export interface GeneratedMenu {
  planId: string
  rows: MenuRecipeRow[]
}

export interface MenuRequestError {
  error?: string
}

export interface VeganMenuArgs {
  week: GenerateMealPlanPayload
  allergens: string[]
}

const GENERATE_ENDPOINT = '/functions/v1/generate-meal-plan';
const MEAL_PLANS_ENDPOINT = '/rest/v1/meal_plans';
const EXPECTED_SLOTS = 21;
const MAX_WEEK_DRAWS = 10;
const REGRESSION_RECIPE_NAME = 'Ensalada cesar';

export class MealPlansApi extends ApiBase {
  private readonly createdIds: string[] = [];

  constructor(options: TestContextOptions) {
    super(options);
  }

  @step
  async listOwnMealPlans(): Promise<[APIResponse, MealPlan[]]> {
    const [response, body] = await this.apiGET<MealPlan[]>(MEAL_PLANS_ENDPOINT, { params: { select: '*' } });
    expect(response.status()).toBe(200);
    return [response, body];
  }

  @step
  async getMealPlanRecipes(planId: string): Promise<[APIResponse, MenuRecipeRow[]]> {
    const [response, body] = await this.apiGET<MenuRecipeRow[]>(
      '/rest/v1/meal_plan_recipes',
      { params: { select: 'id,recipe_id,dia,tipo_plato,recipes(nombre,alergenos,dieta)', meal_plan_id: `eq.${planId}` } },
    );
    expect(response.status()).toBe(200);
    return [response, body];
  }

  async findFreeWeek(): Promise<GenerateMealPlanPayload> {
    const [, plans] = await this.listOwnMealPlans();
    const used = new Set(plans.map(plan => plan.semana_iso));
    for (let draw = 0; draw < MAX_WEEK_DRAWS; draw++) {
      const week = DataFactory.randomFutureIsoWeek();
      if (!used.has(week.semana_iso)) {
        return week;
      }
    }
    throw new Error(`No free ISO week found after ${MAX_WEEK_DRAWS} draws.`);
  }

  @step
  async readMenuForWeek(week: GenerateMealPlanPayload): Promise<GeneratedMenu> {
    return this.readMenu(week);
  }

  @step
  async deleteMenuForWeek(week: GenerateMealPlanPayload): Promise<string[]> {
    const [, plans] = await this.listOwnMealPlans();
    const ids = plans.filter(plan => plan.semana_iso === week.semana_iso).map(plan => plan.id);
    return this.cleanupMenus(ids);
  }

  createdPlanIds(): string[] {
    return [...this.createdIds];
  }

  async cleanupMenus(planIds: string[]): Promise<string[]> {
    const failed: string[] = [];
    for (const planId of planIds) {
      try {
        const [response, body] = await this.apiDELETE<MealPlan[]>(
          MEAL_PLANS_ENDPOINT,
          { params: { id: `eq.${planId}` }, headers: { Prefer: 'return=representation' } },
        );
        if (response.status() !== 200 || body.length !== 1) {
          failed.push(planId);
        }
      }
      catch {
        failed.push(planId);
      }
    }
    return failed;
  }

  private async requestMenu<TBody, TPayload>(payload: TPayload): Promise<[APIResponse, TBody, TPayload]> {
    const [, before] = await this.listOwnMealPlans();
    const known = new Set(before.map(plan => plan.id));
    try {
      const [response, body, sent] = await this.apiPOST<TBody, TPayload>(GENERATE_ENDPOINT, payload);
      if (response.status() === 429) {
        throw new RateLimitError('generate-meal-plan answered 429');
      }
      return [response, body, sent];
    }
    finally {
      try {
        const [, after] = await this.listOwnMealPlans();
        this.createdIds.push(...after.filter(plan => !known.has(plan.id)).map(plan => plan.id));
      }
      catch {}
    }
  }

  private async readMenu(week: GenerateMealPlanPayload): Promise<GeneratedMenu> {
    const [, plans] = await this.listOwnMealPlans();
    const matching = plans.filter(plan => plan.semana_iso === week.semana_iso);
    expect(matching, `exactly one plan for ${week.semana_iso}`).toHaveLength(1);
    const [, rows] = await this.getMealPlanRecipes(matching[0].id);
    return { planId: matching[0].id, rows };
  }

  private async generateAndRead(
    week: GenerateMealPlanPayload,
  ): Promise<[APIResponse, GenerateMealPlanResponse, GenerateMealPlanPayload, GeneratedMenu]> {
    const [response, body, sent] = await this.requestMenu<GenerateMealPlanResponse, GenerateMealPlanPayload>(week);
    expect(response.status(), `generate-meal-plan status for ${week.semana_iso}`).toBe(200);
    const menu = await this.readMenu(week);
    expect(menu.rows, `slots generated for ${week.semana_iso}`).toHaveLength(EXPECTED_SLOTS);
    expect(
      menu.rows.filter(row => row.recipe_id === null || row.recipes === null).map(row => row.id),
      `slots without a recipe for ${week.semana_iso}`,
    ).toEqual([]);
    return [response, body, sent, menu];
  }

  private eggRecipeNames(menu: GeneratedMenu): string[] {
    return menu.rows
      .filter(row => row.recipes?.alergenos.includes('huevo'))
      .map(row => row.recipes?.nombre ?? '');
  }

  @atc('TC-01')
  async generateMenuForEggAllergicProfile(
    week: GenerateMealPlanPayload,
  ): Promise<[APIResponse, GenerateMealPlanResponse, GenerateMealPlanPayload]> {
    const [response, body, sent, menu] = await this.generateAndRead(week);

    expect(this.eggRecipeNames(menu), `recipes tagged huevo in ${week.semana_iso}`).toEqual([]);

    return [response, body, sent];
  }

  @atc('TC-02')
  async generateMenuOnAnotherWeekStaysEggFree(
    week: GenerateMealPlanPayload,
  ): Promise<[APIResponse, GenerateMealPlanResponse, GenerateMealPlanPayload]> {
    const [response, body, sent, menu] = await this.generateAndRead(week);

    expect(this.eggRecipeNames(menu), `recipes tagged huevo in ${week.semana_iso}`).toEqual([]);
    expect(
      menu.rows.filter(row => row.recipes?.nombre === REGRESSION_RECIPE_NAME).map(row => row.id),
      `slots with ${REGRESSION_RECIPE_NAME} in ${week.semana_iso} (regression F-02)`,
    ).toEqual([]);

    return [response, body, sent];
  }

  @atc('TC-03')
  async generateMenuForVeganLactoseFreeProfile(
    { week, allergens }: VeganMenuArgs,
  ): Promise<[APIResponse, GenerateMealPlanResponse, GenerateMealPlanPayload]> {
    const [response, body, sent, menu] = await this.generateAndRead(week);

    const allergenOffenders = menu.rows
      .filter(row => allergens.some(allergen => row.recipes?.alergenos.includes(allergen)))
      .map(row => row.recipes?.nombre ?? '');
    expect(allergenOffenders, `recipes carrying a stored allergen in ${week.semana_iso}`).toEqual([]);

    const dietOffenders = menu.rows
      .filter(row => row.recipes?.dieta.vegano !== true || row.recipes.dieta.sin_lactosa !== true)
      .map(row => row.recipes?.nombre ?? '');
    expect(dietOffenders, `recipes not vegan and lactose-free in ${week.semana_iso}`).toEqual([]);

    return [response, body, sent];
  }

  @atc('CHK-D1')
  async generateMenuWithMissingFields(
    payload: Partial<GenerateMealPlanPayload>,
  ): Promise<[APIResponse, MenuRequestError, Partial<GenerateMealPlanPayload>]> {
    const [response, body, sent] = await this.requestMenu<MenuRequestError, Partial<GenerateMealPlanPayload>>(payload);

    expect(response.status()).toBe(400);
    expect(String(body.error)).toMatch(/Faltan campos/);

    return [response, body, sent];
  }

  @atc('CHK-D2')
  async generateMenuWithInvalidWeek(
    payload: GenerateMealPlanPayload,
  ): Promise<[APIResponse, MenuRequestError, GenerateMealPlanPayload]> {
    const [response, body, sent] = await this.requestMenu<MenuRequestError, GenerateMealPlanPayload>(payload);

    expect(response.status()).toBe(400);
    expect(String(body.error)).toMatch(/no son v/i);

    return [response, body, sent];
  }

  @atc('CHK-D3')
  async generateMenuForExistingWeekReturnsConflict(
    week: GenerateMealPlanPayload,
  ): Promise<[APIResponse, MenuRequestError, GenerateMealPlanPayload]> {
    const before = await this.readMenu(week);

    const [response, body, sent] = await this.requestMenu<MenuRequestError, GenerateMealPlanPayload>(week);

    expect(response.status(), `conflicting request for ${week.semana_iso}`).toBe(409);
    expect(String(body.error)).toMatch(/^Ya existe un plan para la semana/);

    const after = await this.readMenu(week);
    expect(after.planId, `plan id for ${week.semana_iso}`).toBe(before.planId);
    expect(recipeIdSet(after), `recipe ids for ${week.semana_iso}`).toEqual(recipeIdSet(before));

    return [response, body, sent];
  }
}

function recipeIdSet(menu: GeneratedMenu): string[] {
  return [...new Set(menu.rows.map(row => row.recipe_id ?? ''))].sort();
}
