import type { TestContextOptions } from '@TestContext';
import type { AuthRole } from '@variables';

import { AccessControlApi } from '@api/AccessControlApi';
import { ApiBase } from '@api/ApiBase';
import { AuthApi } from '@api/AuthApi';
import { ErasureApi } from '@api/ErasureApi';
import { ExampleApi } from '@api/ExampleApi';
import { MealPlansApi } from '@api/MealPlansApi';
import { ProfilesApi } from '@api/ProfilesApi';
import { RecipesApi } from '@api/RecipesApi';
import { loadRoleState } from '@utils/roleState';

export class ApiFixture extends ApiBase {
  readonly auth: AuthApi;

  readonly example: ExampleApi;

  readonly erasure: ErasureApi;

  readonly profiles: ProfilesApi;

  readonly access: AccessControlApi;

  readonly recipes: RecipesApi;

  readonly mealPlans: MealPlansApi;

  constructor(options: TestContextOptions) {
    super(options);

    this.auth = new AuthApi(options);
    this.example = new ExampleApi(options);
    this.erasure = new ErasureApi(options);
    this.profiles = new ProfilesApi(options);
    this.access = new AccessControlApi(options);
    this.recipes = new RecipesApi(options);
    this.mealPlans = new MealPlansApi(options);
  }

  asRole(role: AuthRole): ApiFixture {
    const state = loadRoleState(role);
    if (!state) {
      throw new Error(`Role state for "${role}" is missing or unreadable: run the api-setup project to create ${this.config.auth.roleStateDir}/${role}.json.`);
    }
    const sibling = new ApiFixture({ request: this.request, environment: this.env });
    sibling.setAuthToken(state.token);
    return sibling;
  }

  override setAuthToken(token: string) {
    super.setAuthToken(token);
    this.auth.setAuthToken(token);
    this.example.setAuthToken(token);
    this.erasure.setAuthToken();
    this.profiles.setAuthToken(token);
    this.access.setAuthToken(token);
    this.recipes.setAuthToken(token);
    this.mealPlans.setAuthToken(token);
  }

  override clearAuthToken() {
    super.clearAuthToken();
    this.auth.clearAuthToken();
    this.example.clearAuthToken();
    this.erasure.clearAuthToken();
    this.profiles.clearAuthToken();
    this.access.clearAuthToken();
    this.recipes.clearAuthToken();
    this.mealPlans.clearAuthToken();
  }
}
