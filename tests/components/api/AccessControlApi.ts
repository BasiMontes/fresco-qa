import type { APIResponse } from '@playwright/test';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc, step } from '@utils/decorators';
import { tamperToken } from '@utils/token';

export type PrivateTable = 'user_profiles' | 'meal_plans' | 'user_consents';

export type DeniedTable = PrivateTable | 'meal_plan_recipes';

export type EdgeFunctionName = 'generate-meal-plan' | 'delete-account';

export interface ReadRowsArgs {
  table: PrivateTable
  ownerId: string
  persona: string
}

export type DeniedBody = Record<string, unknown>;

const OWNER_COLUMN: Record<PrivateTable, string> = {
  user_profiles: 'id',
  meal_plans: 'user_id',
  user_consents: 'user_id',
};

const INVALID_WEEK_BODY = { semana_iso: '2026-W99', fecha_inicio: '2026-01-01' };

export class AccessControlApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  private async withTamperedToken<T>(action: () => Promise<T>): Promise<T> {
    const original = this.authToken;
    if (original === null) {
      throw new Error('No session token in the fixture: there is nothing to tamper with.');
    }
    const tampered = tamperToken(original);
    if (tampered === null) {
      throw new Error('The session token is not a three-part JWT: it cannot be tampered with.');
    }

    this.setAuthToken(tampered);
    try {
      return await action();
    }
    finally {
      this.setAuthToken(original);
    }
  }

  @step
  async readOwnRowsReturnsRows({ table, ownerId, persona }: ReadRowsArgs): Promise<[APIResponse, unknown[]]> {
    const [response, body] = await this.apiGET<unknown[]>(
      `/rest/v1/${table}`,
      { params: { select: '*', [OWNER_COLUMN[table]]: `eq.${ownerId}` } },
    );

    expect(response.status()).toBe(200);
    expect(body.length, `persona ${persona} has no rows in ${table}: the isolation check would be vacuous`).toBeGreaterThanOrEqual(1);

    return [response, body];
  }

  @atc('CHK-A2')
  async readOtherUsersRowsReturnsEmpty(
    { table, ownerId }: Pick<ReadRowsArgs, 'table' | 'ownerId'>,
  ): Promise<[APIResponse, unknown[]]> {
    const [response, body] = await this.apiGET<unknown[]>(
      `/rest/v1/${table}`,
      { params: { select: '*', [OWNER_COLUMN[table]]: `eq.${ownerId}` } },
    );

    expect(response.status()).toBe(200);
    expect(body).toEqual([]);

    return [response, body];
  }

  @atc('CHK-U1-1')
  async readPrivateTableWithoutSessionIsDenied(table: DeniedTable): Promise<[APIResponse, DeniedBody]> {
    expect(this.authToken).toBeNull();
    const [response, body] = await this.apiGET<DeniedBody>(`/rest/v1/${table}`, { params: { select: '*' } });

    expect(response.status()).toBe(401);
    expect(String(body.code)).toBe('42501');
    expect(String(body.message)).toMatch(/permission denied/i);

    return [response, body];
  }

  @atc('CHK-U1-2')
  async callFilterRpcWithoutSessionIsDenied(): Promise<[APIResponse, DeniedBody]> {
    expect(this.authToken).toBeNull();
    const [response, body] = await this.apiPOST<DeniedBody>(
      '/rest/v1/rpc/get_filtered_recipes',
      { p_user_id: '00000000-0000-0000-0000-000000000000' },
    );

    expect(response.status()).toBe(401);
    expect(String(body.code)).toBe('42501');
    expect(String(body.message)).toMatch(/permission denied for function/i);

    return [response, body];
  }

  @atc('CHK-U1-3')
  async callEdgeFunctionWithoutSessionIsDenied(functionName: EdgeFunctionName): Promise<[APIResponse, DeniedBody]> {
    expect(this.authToken).toBeNull();
    const [response, body] = await this.apiPOST<DeniedBody>(`/functions/v1/${functionName}`, {});

    expect(response.status()).toBe(401);
    expect(String(body.error)).toBe('No autorizado');

    return [response, body];
  }

  @atc('CHK-C1-1')
  async readPrivateTableWithTamperedTokenIsDenied(): Promise<[APIResponse, DeniedBody]> {
    return this.withTamperedToken<[APIResponse, DeniedBody]>(async () => {
      const [response, body] = await this.apiGET<DeniedBody>('/rest/v1/user_profiles', { params: { select: 'id' } });

      expect(response.status()).toBe(401);
      expect(Array.isArray(body)).toBe(false);

      return [response, body];
    });
  }

  @atc('CHK-C1-2')
  async callEdgeFunctionWithTamperedTokenIsDenied(): Promise<[APIResponse, DeniedBody]> {
    return this.withTamperedToken<[APIResponse, DeniedBody]>(async () => {
      const [response, body] = await this.apiPOST<DeniedBody>('/functions/v1/generate-meal-plan', INVALID_WEEK_BODY);

      expect(response.status()).toBe(401);
      expect(String(body.msg)).toBe('Invalid JWT');

      return [response, body];
    });
  }
}
