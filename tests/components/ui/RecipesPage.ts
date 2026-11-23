import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc } from '@utils/decorators';

export interface RecipeToAdd {
  name: string
}

const CURRENT_RECIPE_PREFIX = 'Ahora: ';

export class RecipesPage extends UiBase {
  private readonly dialog = () => this.page.getByTestId('add_to_menu_dialog');

  private readonly firstOptionLabel = () => this.dialog().locator('fieldset > label:first-of-type');

  constructor(options: TestContextOptions) {
    super(options);
  }

  @atc('UI-TC-09')
  async replaceOpenMealSlotFromLibrary({ name }: RecipeToAdd): Promise<string> {
    await this.dismissTourOverlayWhenShown();
    await this.page.goto(this.buildUrl(`/recipes?q=${encodeURIComponent(name)}`));

    const card = this.page.getByTestId('recipe_library_grid').getByRole('link').filter({ hasText: name });
    await expect(card, `library cards for ${name}`).toHaveCount(1);
    await card.getByTestId('recipe_card_add_to_menu_button').click();

    await expect(this.dialog()).toBeVisible();
    await expect(this.dialog().getByTestId('add_to_menu_loading')).toBeHidden();
    await expect(this.dialog().getByTestId('add_to_menu_empty_state'), 'an open comida slot today or later').toBeHidden();

    const optionLabel = this.firstOptionLabel();
    const option = optionLabel.getByTestId('add_to_menu_slot_option');
    await expect(option, 'first open slot option').toBeVisible();
    const labelText = await optionLabel.innerText();
    const currentLine = labelText.split('\n').map(line => line.trim()).find(line => line.startsWith(CURRENT_RECIPE_PREFIX));
    expect(currentLine, `current recipe line in the option "${labelText}"`).toBeDefined();

    await option.check();
    const confirm = this.dialog().getByTestId('add_to_menu_confirm_button');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(this.dialog().getByTestId('add_to_menu_success')).toContainText(name);
    await expect(this.dialog().getByTestId('add_to_menu_error')).toBeHidden();

    return (currentLine ?? '').slice(CURRENT_RECIPE_PREFIX.length);
  }
}
