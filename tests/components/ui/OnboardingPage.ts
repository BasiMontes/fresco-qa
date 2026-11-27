import type { LoginPayload } from '@schemas/auth.types';
import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

export interface DietAllergens {
  diets: string[]
  allergens: string[]
}

const MENU_GENERATION_TIMEOUT = 90000;

export class OnboardingPage extends UiBase {
  private readonly exactly = (label: string) => new RegExp(`^${label}$`);

  private readonly dietChip = (label: string) =>
    this.page.getByTestId('dieta_option').filter({ hasText: this.exactly(label) });

  private readonly allergenChip = (label: string) =>
    this.page.getByTestId('alergeno_option').filter({ hasText: this.exactly(label) });

  private readonly selectedDiets = () => this.page.locator('[data-testid="dieta_option"][aria-pressed="true"]');

  private readonly selectedAllergens = () => this.page.locator('[data-testid="alergeno_option"][aria-pressed="true"]');

  private readonly summaryAllergens = () => this.page.getByTestId('summary_allergens').getByRole('listitem');

  constructor(options: TestContextOptions) {
    super(options);
  }

  @step
  async createAccountAndOpenDietStep({ email, password }: LoginPayload): Promise<void> {
    await this.page.addLocatorHandler(this.page.getByTestId('cookie_consent_banner'), async () => {
      await this.page.getByTestId('cookie_consent_reject_button').click();
    });
    await this.page.goto(this.buildUrl('/onboarding'));
    await this.page.getByTestId('confirm_age_checkbox').check();
    await this.page.getByTestId('accept_terms_checkbox').check();
    await this.page.getByTestId('onboarding_create_account_button').click();
    await this.page.getByTestId('email_input').fill(email);
    await this.page.getByTestId('password_input').fill(password);
    await this.page.getByTestId('onboarding_create_account_submit_button').click();
    await this.page.getByTestId('next_button').click();
    await expect(this.dietChip('Vegano'), 'diet step of the onboarding').toBeVisible();
  }

  @step
  async chooseDiets(diets: string[]): Promise<void> {
    for (const diet of diets) {
      await this.dietChip(diet).click();
      await expect(this.dietChip(diet), `diet ${diet}`).toHaveAttribute('aria-pressed', 'true');
    }
  }

  @step
  async finishAndOpenMenu(): Promise<void> {
    await this.page.getByTestId('generate_menu_button').click();
    await this.page.waitForURL(url => url.pathname === '/menu', { timeout: MENU_GENERATION_TIMEOUT });
  }

  @step
  async openSummary(): Promise<void> {
    await this.page.getByTestId('health_consent_checkbox').check();
    await this.page.getByTestId('next_button').click();
    await this.page.getByTestId('view_summary_button').click();
    await expect(this.page.getByTestId('onboarding_summary')).toBeVisible();
  }

  @step
  async skipFirstVisitTour(): Promise<void> {
    const tour = this.page.getByTestId('tour_overlay');
    await expect(tour, 'first-visit tour of a new account').toBeVisible();
    const tourSaved = this.page.waitForResponse(response =>
      response.url().includes('/rest/v1/user_profiles') && response.request().method() === 'PATCH');
    await this.page.getByTestId('tour_skip_button').click();
    expect((await tourSaved).ok(), 'tour stored as seen, so it does not start again').toBe(true);
    await expect(tour).toBeHidden();
  }

  @atc('UI-TC-16-1')
  async showOnlyAllergensImpliedByDiets({ diets, allergens }: DietAllergens): Promise<void> {
    await expect(this.selectedAllergens(), 'no allergen chosen before the diets').toHaveCount(0);

    await this.chooseDiets(diets);
    await this.expectSelectedAllergens(allergens, `allergens selected by ${diets.join(' and ')}`);
    await expect(this.page.getByTestId('next_button'), 'blocked until the health-data consent is given').toBeDisabled();

    await this.openSummary();
    await expect(this.summaryAllergens(), 'allergens listed in the summary').toHaveCount(allergens.length);
    for (const allergen of allergens) {
      await expect(this.summaryAllergens().filter({ hasText: this.exactly(allergen) }), `${allergen} in the summary`).toHaveCount(1);
    }
  }

  @atc('UI-TC-16-2')
  async keepOnlyHandChosenAllergensWhenDietsAreSwitchedOff(): Promise<void> {
    await this.allergenChip('Sulfitos').click();
    await this.expectSelectedAllergens(['Sulfitos'], 'chosen by hand');

    await this.dietChip('Vegano').click();
    await this.expectSelectedAllergens(['Huevo', 'Pescado', 'Sulfitos'], 'vegan on');
    await this.dietChip('Vegano').click();
    await this.expectSelectedAllergens(['Pescado', 'Sulfitos'], 'vegan off, vegetarian still on');
    await this.dietChip('Vegetariano').click();
    await this.expectSelectedAllergens(['Sulfitos'], 'vegetarian off');
    await this.dietChip('Sin gluten').click();
    await this.expectSelectedAllergens(['Gluten', 'Sulfitos'], 'gluten-free on');
    await this.dietChip('Sin gluten').click();
    await this.expectSelectedAllergens(['Sulfitos'], 'gluten-free off');

    await this.allergenChip('Pescado').click();
    await this.dietChip('Vegetariano').click();
    await this.expectSelectedAllergens(['Pescado', 'Sulfitos'], 'vegetarian on over a hand-chosen pescado');
    await expect(this.allergenChip('Pescado'), 'pescado locked while the diet is on').toBeDisabled();
    await this.dietChip('Vegetariano').click();
    await this.expectSelectedAllergens(['Pescado', 'Sulfitos'], 'vegetarian off over a hand-chosen pescado');
    await expect(this.allergenChip('Pescado'), 'pescado unlocked').toBeEnabled();
    await expect(this.selectedDiets(), 'diets left selected').toHaveCount(0);
  }

  private async expectSelectedAllergens(labels: string[], moment: string): Promise<void> {
    await expect(this.selectedAllergens(), `selected allergens, ${moment}`).toHaveCount(labels.length);
    for (const label of labels) {
      await expect(this.allergenChip(label), `${label}, ${moment}`).toHaveAttribute('aria-pressed', 'true');
    }
  }
}
