import type { TestContextOptions } from '@TestContext';

import { createHash } from 'node:crypto';
import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { step } from '@utils/decorators';

export interface UserData {
  profiles: { id: string, alergenos: string[] }[]
  menus: { id: string }[]
  consents: { kind: string, version: string }[]
}

export interface ErasureRecord {
  stripe: string
  posthog: string
  pending_posthog_distinct_id: string | null
}

const LOCAL_API = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/;

export class ErasureApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // No-op on purpose: ApiBase would replace the service Authorization header with a person's token.
  override setAuthToken(): void {}

  @step
  async readUserData(userId: string): Promise<UserData> {
    return {
      profiles: await this.readAsService('user_profiles', { select: 'id,alergenos', id: `eq.${userId}` }),
      menus: await this.readAsService('meal_plans', { select: 'id', user_id: `eq.${userId}`, order: 'id' }),
      consents: await this.readAsService('user_consents', { select: 'kind,version', user_id: `eq.${userId}`, order: 'kind,version' }),
    };
  }

  @step
  async readErasureRecords(userId: string): Promise<ErasureRecord[]> {
    const hash = createHash('sha256').update(userId).digest('hex');
    return this.readAsService<ErasureRecord>('account_erasures', {
      select: 'stripe,posthog,pending_posthog_distinct_id',
      user_hash: `eq.${hash}`,
    });
  }

  private async readAsService<TRow>(table: string, params: Record<string, string>): Promise<TRow[]> {
    if (!LOCAL_API.test(this.apiBaseUrl)) {
      throw new Error(`The service role key is only used against a local stack, not ${this.apiBaseUrl}.`);
    }
    const key = this.config.auth.supabaseServiceRoleKey;
    const [response, body] = await this.apiGET<TRow[]>(`/rest/v1/${table}`, {
      params,
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      sensitive: true,
    });
    expect(response.status(), `read of ${table} with the service role`).toBe(200);
    return body;
  }
}
