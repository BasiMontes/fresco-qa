import type { APIResponse } from '@playwright/test';
import type { DietaryPreferences, Household, PostgrestError, UserProfile } from '@schemas/profiles.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { postgrestErrorSchema, userProfileSchema } from '@schemas/profiles.schema';
import { toDietaryPreferences, toHousehold } from '@schemas/profiles.types';
import { atc, step } from '@utils/decorators';
import { expectMatchesSchema } from '@utils/schema';
import { tokenSubject } from '@utils/token';

export interface InvalidProfileWrite {
  patch: Record<string, unknown>
  code: string
}

const PROFILES_ENDPOINT = '/rest/v1/user_profiles';
const RETURN_REPRESENTATION = { Prefer: 'return=representation' };

export class ProfilesApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  private callerId(): string {
    const subject = this.authToken === null ? null : tokenSubject(this.authToken);
    if (subject === null) {
      throw new Error('callerId requires a session token that carries a subject.');
    }
    return subject;
  }

  @step
  async getOwnProfile(): Promise<[APIResponse, UserProfile]> {
    const [response, body] = await this.apiGET<UserProfile[]>(PROFILES_ENDPOINT, { params: { select: '*' } });
    expect(response.status()).toBe(200);
    expect(body).toHaveLength(1);
    return [response, body[0]];
  }

  async restoreHousehold(snapshot: Household): Promise<[APIResponse, UserProfile[]]> {
    const [response, body] = await this.apiPATCH<UserProfile[], Household>(
      PROFILES_ENDPOINT,
      snapshot,
      { params: { id: `eq.${this.callerId()}` }, headers: RETURN_REPRESENTATION },
    );
    expect(response.status()).toBe(200);
    expect(body).toHaveLength(1);
    return [response, body];
  }

  @step
  async setDietaryPreferences(preferences: DietaryPreferences): Promise<[APIResponse, UserProfile[]]> {
    const [response, body] = await this.apiPATCH<UserProfile[], DietaryPreferences>(
      PROFILES_ENDPOINT,
      preferences,
      { params: { id: `eq.${this.callerId()}` }, headers: RETURN_REPRESENTATION },
    );
    expect(response.status()).toBe(200);
    expect(body).toHaveLength(1);
    expect(toDietaryPreferences(body[0]), 'dietary preferences stored by the write').toEqual({
      ...preferences,
      alergenos: [...preferences.alergenos].sort(),
    });
    return [response, body];
  }

  @step
  async restoreDietaryPreferences(snapshot: DietaryPreferences): Promise<[APIResponse, UserProfile[]]> {
    const [response, body] = await this.apiPATCH<UserProfile[], DietaryPreferences>(
      PROFILES_ENDPOINT,
      snapshot,
      { params: { id: `eq.${this.callerId()}` }, headers: RETURN_REPRESENTATION },
    );
    expect(response.status()).toBe(200);
    expect(body).toHaveLength(1);
    return [response, body];
  }

  @step
  async setWeeklyBudget(budget: number | null): Promise<[APIResponse, UserProfile[]]> {
    const [response, body] = await this.apiPATCH<UserProfile[], Pick<UserProfile, 'presupuesto_semana_euros'>>(
      PROFILES_ENDPOINT,
      { presupuesto_semana_euros: budget },
      { params: { id: `eq.${this.callerId()}` }, headers: RETURN_REPRESENTATION },
    );
    expect(response.status()).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].presupuesto_semana_euros, 'weekly budget stored by the write').toBe(budget);
    return [response, body];
  }

  @atc('CHK-S1')
  async readOwnProfileMatchesSchema(): Promise<[APIResponse, UserProfile]> {
    const [response, body] = await this.apiGET<UserProfile[]>(PROFILES_ENDPOINT, { params: { select: '*' } });

    expect(response.status()).toBe(200);
    expect(body).toHaveLength(1);
    const profile = expectMatchesSchema(userProfileSchema, body[0], 'own profile row');
    expect(profile.id).toBe(this.callerId());

    return [response, profile];
  }

  @atc('CHK-E5')
  async updateProfileWithInvalidValueIsRejected(
    { patch, code }: InvalidProfileWrite,
  ): Promise<[APIResponse, PostgrestError]> {
    const [, before] = await this.getOwnProfile();

    const [response, body] = await this.apiPATCH<PostgrestError, Record<string, unknown>>(
      PROFILES_ENDPOINT,
      patch,
      { params: { id: `eq.${this.callerId()}` }, headers: RETURN_REPRESENTATION },
    );

    expect(response.status()).toBe(400);
    const error = expectMatchesSchema(postgrestErrorSchema, body, 'rejected profile write');
    expect(error.code).toBe(code);

    const [, after] = await this.getOwnProfile();
    expect(after, 'profile after the rejected write').toEqual(before);

    return [response, error];
  }

  @atc('CHK-E6')
  async insertDuplicateProfileIsRejected(): Promise<[APIResponse, PostgrestError]> {
    const [, before] = await this.getOwnProfile();

    const [response, body] = await this.apiPOST<PostgrestError, Household & { id: string }>(
      PROFILES_ENDPOINT,
      { id: this.callerId(), ...toHousehold(before) },
      { headers: RETURN_REPRESENTATION },
    );

    expect(response.status()).toBe(409);
    const error = expectMatchesSchema(postgrestErrorSchema, body, 'rejected duplicate profile');
    expect(error.code).toBe('23505');

    const [, after] = await this.getOwnProfile();
    expect(after, 'profile after the rejected insert').toEqual(before);

    return [response, error];
  }

  @atc('CHK-A1')
  async listOwnProfilesReturnsOnlyOwnRow(): Promise<[APIResponse, Pick<UserProfile, 'id'>[]]> {
    const [response, body] = await this.apiGET<Pick<UserProfile, 'id'>[]>(PROFILES_ENDPOINT, { params: { select: 'id' } });

    expect(response.status()).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(this.callerId());

    return [response, body];
  }

  @atc('CHK-A5')
  async updateOtherUsersProfileChangesNothing(
    victimId: string,
    current: Household,
  ): Promise<[APIResponse, UserProfile[], Household]> {
    const [response, body, sent] = await this.apiPATCH<UserProfile[], Household>(
      PROFILES_ENDPOINT,
      current,
      { params: { id: `eq.${victimId}` }, headers: RETURN_REPRESENTATION },
    );

    expect(response.status()).toBe(200);
    expect(body).toEqual([]);

    return [response, body, sent];
  }

  @atc('TC-08-1')
  async updateHouseholdWithinLimits(household: Household): Promise<[APIResponse, UserProfile[], Household]> {
    const [response, body, sent] = await this.apiPATCH<UserProfile[], Household>(
      PROFILES_ENDPOINT,
      household,
      { params: { id: `eq.${this.callerId()}` }, headers: RETURN_REPRESENTATION },
    );

    expect(response.status()).toBe(200);
    expect(body).toHaveLength(1);
    expect(toHousehold(body[0])).toEqual(household);

    const [, stored] = await this.getOwnProfile();
    expect(toHousehold(stored)).toEqual(household);

    return [response, body, sent];
  }

  @atc('TC-08-2')
  async updateHouseholdOutsideLimits(household: Household): Promise<[APIResponse, PostgrestError, Household]> {
    const [, before] = await this.getOwnProfile();

    const [response, body, sent] = await this.apiPATCH<PostgrestError, Household>(
      PROFILES_ENDPOINT,
      household,
      { params: { id: `eq.${this.callerId()}` }, headers: RETURN_REPRESENTATION },
    );

    expect(response.status()).toBe(400);
    expect(body.code).toBe('23514');

    const [, after] = await this.getOwnProfile();
    expect(toHousehold(after)).toEqual(toHousehold(before));

    return [response, body, sent];
  }
}
