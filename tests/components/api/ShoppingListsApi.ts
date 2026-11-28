import type { APIResponse } from '@playwright/test';
import type { ShoppingList } from '@schemas/shopping.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { shoppingListsSchema } from '@schemas/shopping.schema';
import { step } from '@utils/decorators';
import { expectMatchesSchema } from '@utils/schema';

const SHOPPING_LISTS_ENDPOINT = '/rest/v1/shopping_lists';

export class ShoppingListsApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  @step
  async listsOfPlan(planId: string): Promise<[APIResponse, ShoppingList[]]> {
    const [response, body] = await this.apiGET<ShoppingList[]>(
      SHOPPING_LISTS_ENDPOINT,
      { params: { select: 'id,meal_plan_id,items', meal_plan_id: `eq.${planId}` } },
    );
    expect(response.status()).toBe(200);
    expectMatchesSchema(shoppingListsSchema, body, `shopping lists of plan ${planId}`);
    return [response, body];
  }

  @step
  async deleteListOfPlan(planId: string): Promise<[APIResponse, Pick<ShoppingList, 'id'>[]]> {
    const [response, body] = await this.apiDELETE<Pick<ShoppingList, 'id'>[]>(
      SHOPPING_LISTS_ENDPOINT,
      { params: { meal_plan_id: `eq.${planId}`, select: 'id' }, headers: { Prefer: 'return=representation' } },
    );
    expect(response.status()).toBe(200);
    const [, left] = await this.listsOfPlan(planId);
    expect(left, `shopping lists of plan ${planId} after the deletion`).toEqual([]);
    return [response, body];
  }
}
