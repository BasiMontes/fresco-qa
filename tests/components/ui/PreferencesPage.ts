import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

export interface FilterSelection {
  diet: string
  allergen: string
}

export class PreferencesPage extends UiBase {
  private readonly dietChip = (label: string) =>
    this.page.getByTestId('preferencia_dieta_option').filter({ hasText: label });

  private readonly allergenChip = (label: string) =>
    this.page.getByTestId('preferencia_alergeno_option').filter({ hasText: label });

  constructor(options: TestContextOptions) {
    super(options);
  }

  @step
  async confirmFreePlan(): Promise<void> {
    await this.dismissTourOverlayWhenShown();
    await this.page.goto(this.buildUrl('/profile'));
    await expect(this.page.getByTestId('pro_upsell_card'), 'Free plan: the Pro upsell card must show on /profile').toBeVisible();
  }

  @step
  async goto(): Promise<void> {
    await this.page.goto(this.buildUrl('/profile/preferences'));
    await expect(this.page.getByTestId('preferencesForm')).toBeVisible();
  }

  @step
  async expectChipsPersisted(selection: FilterSelection): Promise<void> {
    await this.page.reload();
    await expect(this.dietChip(selection.diet), `diet chip ${selection.diet} after reload`).toHaveAttribute('aria-pressed', 'true');
    await expect(this.allergenChip(selection.allergen), `allergen chip ${selection.allergen} after reload`).toHaveAttribute('aria-pressed', 'true');
  }

  @step
  async expectAllergenPersisted(label: string): Promise<void> {
    await this.page.reload();
    await expect(this.allergenChip(label), `allergen chip ${label} after reload`).toHaveAttribute('aria-pressed', 'true');
  }

  @atc('UI-TC-05')
  async saveLupinAllergen(): Promise<void> {
    const lupin = this.allergenChip('Altramuces');
    await expect(lupin, 'allergen chip Altramuces').toBeEnabled();
    await lupin.click();
    await expect(lupin).toHaveAttribute('aria-pressed', 'true');

    const save = this.page.getByTestId('actualizar_preferencias_button');
    await expect(save, 'save button (a visible health consent block keeps it disabled)').toBeEnabled();
    await save.click();

    await expect(this.page.getByTestId('preferencias_saved_message')).toBeVisible();
    await expect(this.page.getByTestId('pro_checkout_dialog')).toBeHidden();
  }

  @atc('UI-TC-14')
  async saveDietAndAllergenFiltersOnFreePlan(selection: FilterSelection): Promise<void> {
    const diet = this.dietChip(selection.diet);
    await expect(diet, `diet chip ${selection.diet}`).toBeEnabled();
    await diet.click();
    await expect(diet).toHaveAttribute('aria-pressed', 'true');

    const allergen = this.allergenChip(selection.allergen);
    await expect(allergen, `allergen chip ${selection.allergen}`).toBeEnabled();
    await allergen.click();
    await expect(allergen).toHaveAttribute('aria-pressed', 'true');

    const save = this.page.getByTestId('actualizar_preferencias_button');
    await expect(save, 'save button (a visible health consent block keeps it disabled)').toBeEnabled();
    await save.click();

    await expect(this.page.getByTestId('preferencias_saved_message')).toBeVisible();
    await expect(this.page.getByTestId('pro_checkout_dialog')).toBeHidden();
  }
}
