import type { APIResponse } from '@playwright/test';
import type { AuthErrorResponse, LoginPayload, TokenResponse, UserInfoResponse } from '@schemas/auth.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc, step } from '@utils/decorators';

export interface PasswordGrantResponse extends Partial<TokenResponse> {
  user?: { id: string }
  error?: string
  error_description?: string
  msg?: string
}

export interface SignInResult {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken: string | null
  userId: string
}

export type { AuthErrorResponse, LoginPayload, TokenResponse, UserInfoResponse } from '@schemas/auth.types';

export class AuthApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  @step
  async getCurrentUser(): Promise<[APIResponse, UserInfoResponse]> {
    const [response, body] = await this.apiGET<UserInfoResponse>(this.config.auth.meEndpoint);
    return [response, body];
  }

  @step
  async signInWithPassword({ email, password }: LoginPayload): Promise<SignInResult> {
    const [response, body] = await this.apiPOST<PasswordGrantResponse, LoginPayload>(
      this.config.auth.loginEndpoint,
      { email, password },
      { headers: { apikey: this.config.auth.supabaseAnonKey }, sensitive: true },
    );

    if (response.status() !== 200 || !body.access_token || !body.user?.id) {
      const reason = body.error_description ?? body.msg ?? body.error ?? 'no message';
      throw new Error(`signInWithPassword failed for ${email}: status ${response.status()} - ${String(reason)}`);
    }

    return {
      accessToken: body.access_token,
      tokenType: body.token_type ?? 'bearer',
      expiresIn: body.expires_in ?? 0,
      refreshToken: body.refresh_token ?? null,
      userId: body.user.id,
    };
  }

  @step
  async expectSignInRejected({ email, password }: LoginPayload): Promise<void> {
    const [response, body] = await this.apiPOST<PasswordGrantResponse, LoginPayload>(
      this.config.auth.loginEndpoint,
      { email, password },
      { headers: { apikey: this.config.auth.supabaseAnonKey }, sensitive: true },
    );
    expect(response.status(), 'status of a sign-in that must be rejected').toBe(400);
    expect(body.msg ?? body.error_description, 'reason of the rejection').toBe('Invalid login credentials');
  }

  @atc('PROJ-101')
  async authenticateSuccessfully(
    credentials: LoginPayload,
  ): Promise<[APIResponse, TokenResponse, LoginPayload]> {
    const [response, body, sentPayload] = await this.apiPOST<TokenResponse, LoginPayload>(
      this.config.auth.loginEndpoint,
      credentials,
    );

    expect(response.status()).toBe(200);
    expect(body.access_token).toBeDefined();
    expect(body.token_type).toBe('Bearer');
    expect(body.expires_in).toBeGreaterThan(0);

    this.setAuthToken(body.access_token);

    const [meResponse, meBody] = await this.getCurrentUser();
    expect(meResponse.status()).toBe(200);
    expect(meBody.user).toBeDefined();
    expect(meBody.user.email).toBe(credentials.email);

    return [response, body, sentPayload];
  }

  @atc('PROJ-102')
  async loginWithInvalidCredentials(
    credentials: LoginPayload,
  ): Promise<[APIResponse, AuthErrorResponse, LoginPayload]> {
    const [response, body, sentPayload] = await this.apiPOST<AuthErrorResponse, LoginPayload>(
      this.config.auth.loginEndpoint,
      credentials,
    );

    expect(response.status()).toBe(401);
    expect(response.ok()).toBe(false);
    expect(body.error).toBeDefined();

    const savedToken = this.authToken;
    this.clearAuthToken();
    const [meResponse] = await this.getCurrentUser();
    expect(meResponse.status()).toBe(401);
    if (savedToken) {
      this.setAuthToken(savedToken);
    }

    return [response, body, sentPayload];
  }
}
