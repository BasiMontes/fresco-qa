import type { APIResponse } from '@playwright/test';
import type { Recipe, RpcError } from '@schemas/recipes.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc, step } from '@utils/decorators';

export interface FilteredByAllergensArgs {
  userId: string
  allergens: string[]
}

export interface FilteredByDietArgs {
  userId: string
  diet: string[]
}

export interface SafeRecipesOfTypeArgs {
  userId: string
  type: 'desayuno' | 'comida' | 'cena'
}

const FILTER_ENDPOINT = '/rest/v1/rpc/get_filtered_recipes';
const RECIPES_ENDPOINT = '/rest/v1/recipes';
const PAGE_SIZE = 1000;

type RecipeIdentity = Pick<Recipe, 'id' | 'nombre' | 'alergenos'>;

export class RecipesApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  @step
  async listCatalogTaggedWithAllergen(allergen: string): Promise<[APIResponse, Pick<Recipe, 'nombre'>[]]> {
    const [response, body] = await this.apiGET<Pick<Recipe, 'nombre'>[]>(
      RECIPES_ENDPOINT,
      { params: { select: 'nombre', alergenos: `cs.["${allergen}"]` } },
    );
    expect(response.status()).toBe(200);
    return [response, body];
  }

  @step
  async listCatalogRecipesNamed(name: string): Promise<[APIResponse, Pick<Recipe, 'nombre' | 'alergenos'>[]]> {
    const [response, body] = await this.apiGET<Pick<Recipe, 'nombre' | 'alergenos'>[]>(
      RECIPES_ENDPOINT,
      { params: { select: 'nombre,alergenos', nombre: `eq.${name}` } },
    );
    expect(response.status()).toBe(200);
    return [response, body];
  }

  private async readAllPages(
    read: (range: string) => Promise<[APIResponse, RecipeIdentity[]]>,
    source: string,
  ): Promise<[APIResponse, RecipeIdentity[]]> {
    const rows: RecipeIdentity[] = [];
    for (;;) {
      const [response, page] = await read(`${rows.length}-${rows.length + PAGE_SIZE - 1}`);
      expect([200, 206], `${source} status at offset ${rows.length}`).toContain(response.status());
      rows.push(...page);
      const total = Number((response.headers()['content-range'] ?? '').split('/')[1]);
      if (page.length === 0 || (Number.isFinite(total) && rows.length >= total)) {
        return [response, rows];
      }
    }
  }

  @step
  async listActiveCatalog(): Promise<[APIResponse, RecipeIdentity[]]> {
    return this.readAllPages(
      async range => this.apiGET<RecipeIdentity[]>(RECIPES_ENDPOINT, {
        params: { select: 'id,nombre,alergenos', activo: 'eq.true', order: 'id' },
        headers: { 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': range },
      }),
      'active catalogue',
    );
  }

  @step
  async listFilteredRecipes(userId: string): Promise<[APIResponse, RecipeIdentity[]]> {
    return this.readAllPages(
      async (range) => {
        const [response, page] = await this.apiPOST<RecipeIdentity[]>(
          FILTER_ENDPOINT,
          { p_user_id: userId },
          { params: { order: 'id' }, headers: { 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': range } },
        );
        return [response, page];
      },
      'filter RPC',
    );
  }

  @step
  async listSafeRecipesOfType({ userId, type }: SafeRecipesOfTypeArgs): Promise<[APIResponse, RecipeIdentity[]]> {
    const [response, body] = await this.apiPOST<RecipeIdentity[]>(
      FILTER_ENDPOINT,
      { p_user_id: userId },
      { params: { 'select': 'id,nombre,alergenos', 'clasificacion->>tipo_plato': `eq.${type}`, 'order': 'nombre', 'limit': '200' } },
    );
    expect(response.status(), `filter RPC status for ${type} recipes`).toBe(200);
    return [response, body];
  }

  @atc('TC-04')
  async getFilteredRecipesExcludeEveryDeclaredAllergen(
    { userId, allergens }: FilteredByAllergensArgs,
  ): Promise<[APIResponse, RecipeIdentity[]]> {
    expect(allergens.length, 'no allergen declared: the union check would be vacuous').toBeGreaterThan(0);
    const carriesDeclared = (recipe: RecipeIdentity): boolean => allergens.some(allergen => recipe.alergenos.includes(allergen));

    const [, catalog] = await this.listActiveCatalog();
    for (const allergen of allergens) {
      expect(
        catalog.filter(recipe => recipe.alergenos.includes(allergen)).length,
        `the active catalogue holds no recipe tagged ${allergen}: its exclusion would be vacuous`,
      ).toBeGreaterThan(0);
    }
    const expectedSafe = catalog.filter(recipe => !carriesDeclared(recipe));
    expect(expectedSafe.length, 'every active recipe carries a declared allergen: an empty result would pass for the wrong reason').toBeGreaterThan(0);

    const [response, filtered] = await this.listFilteredRecipes(userId);

    expect(filtered.filter(carriesDeclared).map(recipe => recipe.nombre), `recipes returned with a declared allergen (${allergens.join(', ')})`).toEqual([]);
    expect(filtered.map(recipe => recipe.id).sort(), 'ids returned by the filter against the safe ids of the active catalogue').toEqual(expectedSafe.map(recipe => recipe.id).sort());

    return [response, filtered];
  }

  @atc('TC-15')
  async getFilteredRecipesForAnotherUserRejected(targetUserId: string): Promise<[APIResponse, RpcError]> {
    const [response, body] = await this.apiPOST<RpcError>(FILTER_ENDPOINT, { p_user_id: targetUserId });

    expect(response.status()).toBe(400);
    expect(String(body.message)).toMatch(/does not own profile/i);

    return [response, body];
  }

  @atc('CHK-B2-1')
  async getFilteredRecipesExcludeDeclaredAllergens(
    { userId, allergens }: FilteredByAllergensArgs,
  ): Promise<[APIResponse, Recipe[]]> {
    expect(allergens.length, 'the stored profile declares no allergen: the exclusion check would be vacuous').toBeGreaterThan(0);

    const [response, body] = await this.apiPOST<Recipe[]>(FILTER_ENDPOINT, { p_user_id: userId });

    expect(response.status()).toBe(200);
    expect(body.length).toBeGreaterThan(0);

    const offenders = body.filter(recipe => allergens.some(allergen => recipe.alergenos.includes(allergen)));
    expect(offenders.map(recipe => recipe.nombre)).toEqual([]);

    return [response, body];
  }

  @atc('CHK-B2-2')
  async getFilteredRecipesMatchDeclaredDiet({ userId, diet }: FilteredByDietArgs): Promise<[APIResponse, Recipe[]]> {
    expect(diet.length, 'the stored profile declares no diet flag: the diet check would be vacuous').toBeGreaterThan(0);

    const [response, body] = await this.apiPOST<Recipe[]>(FILTER_ENDPOINT, { p_user_id: userId });

    expect(response.status()).toBe(200);
    expect(body.length).toBeGreaterThan(0);

    const offenders = body.filter(recipe => diet.some(flag => recipe.dieta[flag] !== true));
    expect(offenders.map(recipe => recipe.nombre)).toEqual([]);

    return [response, body];
  }

  @atc('CHK-U4')
  async listCatalogWithoutSession(): Promise<[APIResponse, Pick<Recipe, 'nombre'>[]]> {
    expect(this.authToken).toBeNull();
    const [response, body] = await this.apiGET<Pick<Recipe, 'nombre'>[]>(
      RECIPES_ENDPOINT,
      { params: { select: 'nombre', limit: '1' } },
    );

    expect(response.status()).toBe(200);
    expect(body).toHaveLength(1);

    return [response, body];
  }
}
