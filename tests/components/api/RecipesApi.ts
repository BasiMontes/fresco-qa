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

const FILTER_ENDPOINT = '/rest/v1/rpc/get_filtered_recipes';
const RECIPES_ENDPOINT = '/rest/v1/recipes';

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
