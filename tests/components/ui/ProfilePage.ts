import type { LoginPayload } from '@schemas/auth.types';
import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

const GUEST_CONFIRMATION_PHRASE = 'BORRAR CUENTA';
const DELETION_TIMEOUT = 60000;

export class ProfilePage extends UiBase {
  private readonly confirmationInput = () => this.page.getByTestId('delete_account_email_input');

  private readonly passwordInput = () => this.page.getByTestId('delete_account_password_input');

  private readonly confirmButton = () => this.page.getByTestId('delete_account_confirm_button');

  constructor(options: TestContextOptions) {
    super(options);
  }

  @step
  async openDeleteAccountDialog(): Promise<void> {
    await this.page.goto(this.buildUrl('/profile'));
    await this.page.getByTestId('delete_account_open_button').click();
    await expect(this.page.getByTestId('delete_account_dialog')).toBeVisible();
  }

  @atc('UI-TC-12-1')
  async deleteRegisteredAccount({ email, password }: LoginPayload): Promise<void> {
    await expect(this.confirmButton(), 'blocked before any confirmation').toBeDisabled();
    await this.confirmationInput().fill(email);
    await expect(this.confirmButton(), 'blocked without the password').toBeDisabled();
    await this.passwordInput().fill(password);
    await this.confirmButton().click();

    await this.page.waitForURL(url => url.pathname === '/login' && url.searchParams.get('account_deleted') === '1', { timeout: DELETION_TIMEOUT });
  }

  @atc('UI-TC-12-2')
  async deleteGuestAccount(): Promise<void> {
    await expect(this.passwordInput(), 'a guest is not asked for a password').toHaveCount(0);
    await expect(this.confirmButton(), 'blocked before any confirmation').toBeDisabled();
    await this.confirmationInput().fill(GUEST_CONFIRMATION_PHRASE);
    await this.confirmButton().click();

    await this.page.waitForURL(url => url.pathname === '/login' && url.searchParams.get('account_deleted') === '1', { timeout: DELETION_TIMEOUT });
  }

  @atc('UI-TC-12-3')
  async keepAccountWhenPasswordIsWrong({ email, password }: LoginPayload): Promise<void> {
    await this.confirmationInput().fill(email);
    await this.passwordInput().fill(password);
    const reauthentication = this.page.waitForResponse(response =>
      response.url().includes('/auth/v1/token?grant_type=password') && response.request().method() === 'POST');
    await this.confirmButton().click();

    const refused = await reauthentication;
    expect(refused.status(), 'status of the re-authentication').toBe(400);
    expect(await refused.json(), 'reason of the refusal').toMatchObject({ code: 'invalid_credentials' });
    await expect(this.page.getByTestId('delete_account_error_message')).toHaveText('La contraseña no es correcta.');
    await expect(this.page).toHaveURL(url => url.pathname === '/profile');
  }
}
