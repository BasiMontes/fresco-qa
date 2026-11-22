import type { APIResponse } from '@playwright/test';
import type { DietaryPreferences, Household, PostgrestError, UserProfile } from '@schemas/profiles.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { toDietaryPreferences, toHousehold } from '@schemas/profiles.types';
import { atc, step } from '@utils/decorators';
import { tokenSubject } from '@utils/token';

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
