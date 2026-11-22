import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { TestContextOptions } from '@TestContext';

import { TestContext } from '@TestContext';
import { attachRequestResponseToAllure } from '@utils/allure';

export interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, string>
  timeout?: number
  sensitive?: boolean
}

export class ApiBase extends TestContext {
  readonly apiBaseUrl: string;

  authToken: string | null = null;

  requestHeaders: Record<string, string> = {
    // Accept */* avoids 406 from servers that reject an explicit application/json.
    'Accept': '*/*',
    'Content-Type': 'application/json',
  };

  constructor(options: TestContextOptions) {
    super(options);
    this.apiBaseUrl = this.config.apiUrl;
  }

  get request(): APIRequestContext {
    // page.request shares cookies and storage with the browser; standalone request otherwise.
    if (this._page) {
      return this._page.request;
    }

    if (!this._request) {
      throw new Error(
        'Request context is not available. ApiBase requires a request instance. '
        + 'Make sure you are using an API fixture (api or test).',
      );
    }
    return this._request;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  async getResponseJsonObject<T = Record<string, unknown>>(response: APIResponse): Promise<T> {
    const status = response.status();
    const endpoint = response.url().split('?')[0];

    console.log(`---- API ${response.ok() ? 'OK' : 'NOK'}: ${status} - ${endpoint}`);

    try {
      return (await response.json()) as T;
    }
    catch {
      return {} as T;
    }
  }

  // protected on purpose: tests go through an ATC or @step helper, never raw HTTP.
  protected async apiGET<TBody = Record<string, unknown>>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<[APIResponse, TBody]> {
    const url = this.apiEndpoint(endpoint);
    const headers = this.buildHeaders(options.headers);

    const response = await this.request.get(url, {
      headers,
      params: options.params,
      timeout: options.timeout ?? this.config.browser.defaultTimeout,
    });

    const body = await this.getResponseJsonObject<TBody>(response);

    await this.attachExchange({ response, endpoint, method: 'GET', responseBody: body, options });

    return [response, body];
  }

  protected async apiPOST<TBody = Record<string, unknown>, TPayload = Record<string, unknown>>(
    endpoint: string,
    data: TPayload,
    options: RequestOptions = {},
  ): Promise<[APIResponse, TBody, TPayload]> {
    const url = this.apiEndpoint(endpoint);
    const headers = this.buildHeaders(options.headers);

    const response = await this.request.post(url, {
      headers,
      data,
      params: options.params,
      timeout: options.timeout ?? this.config.browser.defaultTimeout,
    });

    const body = await this.getResponseJsonObject<TBody>(response);

    await this.attachExchange({
      response,
      endpoint,
      method: 'POST',
      responseBody: body,
      requestBody: data,
      options,
    });

    return [response, body, data];
  }

  protected async apiPUT<TBody = Record<string, unknown>, TPayload = Record<string, unknown>>(
    endpoint: string,
    data: TPayload,
    options: RequestOptions = {},
  ): Promise<[APIResponse, TBody, TPayload]> {
    const url = this.apiEndpoint(endpoint);
    const headers = this.buildHeaders(options.headers);

    const response = await this.request.put(url, {
      headers,
      data,
      params: options.params,
      timeout: options.timeout ?? this.config.browser.defaultTimeout,
    });

    const body = await this.getResponseJsonObject<TBody>(response);

    await this.attachExchange({
      response,
      endpoint,
      method: 'PUT',
      responseBody: body,
      requestBody: data,
      options,
    });

    return [response, body, data];
  }

  protected async apiPATCH<TBody = Record<string, unknown>, TPayload = Record<string, unknown>>(
    endpoint: string,
    data: TPayload,
    options: RequestOptions = {},
  ): Promise<[APIResponse, TBody, TPayload]> {
    const url = this.apiEndpoint(endpoint);
    const headers = this.buildHeaders(options.headers);

    const response = await this.request.patch(url, {
      headers,
      data,
      params: options.params,
      timeout: options.timeout ?? this.config.browser.defaultTimeout,
    });

    const body = await this.getResponseJsonObject<TBody>(response);

    await this.attachExchange({
      response,
      endpoint,
      method: 'PATCH',
      responseBody: body,
      requestBody: data,
      options,
    });

    return [response, body, data];
  }

  protected async apiPOSTForm<TBody = Record<string, unknown>>(
    endpoint: string,
    formData: Record<string, string>,
    options: RequestOptions = {},
  ): Promise<[APIResponse, TBody, Record<string, string>]> {
    const url = endpoint.startsWith('http') ? endpoint : this.apiEndpoint(endpoint);
    const headers = {
      ...this.buildHeaders(options.headers),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const response = await this.request.post(url, {
      headers,
      form: formData,
      params: options.params,
      timeout: options.timeout ?? this.config.browser.defaultTimeout,
    });

    const body = await this.getResponseJsonObject<TBody>(response);

    const safeFormData = { ...formData };
    if (safeFormData.password) {
      safeFormData.password = '***';
    }
    await this.attachExchange({
      response,
      endpoint,
      method: 'POST',
      responseBody: body,
      requestBody: safeFormData,
      options,
    });

    return [response, body, formData];
  }

  protected async apiDELETE<TBody = Record<string, unknown>>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<[APIResponse, TBody]> {
    const url = this.apiEndpoint(endpoint);
    const headers = this.buildHeaders(options.headers);

    const response = await this.request.delete(url, {
      headers,
      params: options.params,
      timeout: options.timeout ?? this.config.browser.defaultTimeout,
    });

    const body = await this.getResponseJsonObject<TBody>(response);

    await this.attachExchange({ response, endpoint, method: 'DELETE', responseBody: body, options });

    return [response, body];
  }

  private async attachExchange(args: {
    response: APIResponse
    endpoint: string
    method: string
    responseBody: unknown
    requestBody?: unknown
    options: RequestOptions
  }): Promise<void> {
    const { response, endpoint, method, responseBody, requestBody, options } = args;

    if (options.sensitive) {
      await attachRequestResponseToAllure({
        url: endpoint,
        method,
        responseBody: { status: response.status() },
      });
      return;
    }

    await attachRequestResponseToAllure({ url: endpoint, method, responseBody, requestBody });
  }

  apiEndpoint(endpoint: string): string {
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${cleanEndpoint}`;
  }

  buildHeaders(customHeaders?: Record<string, string>) {
    const headers: Record<string, string> = {
      ...this.requestHeaders,
      ...customHeaders,
    };

    const anonKey = this.config.auth.supabaseAnonKey;
    if (anonKey !== '' && headers.apikey === undefined) {
      headers.apikey = anonKey;
    }

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }
}
