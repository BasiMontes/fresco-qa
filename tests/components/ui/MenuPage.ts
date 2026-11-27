import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { BUDGET_WARNING_PREFIX, budgetWarningText, toCents } from '@utils/budgetWarning';
import { atc, step } from '@utils/decorators';

export interface MenuBudgetWarning {
  cost: number
  warning: string
}

const SPEND_AMOUNT = /(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})\s*€/;

export class MenuPage extends UiBase {
  private readonly budgetWarnings = () => this.page.getByTestId('menu_advertencias_banner').getByRole('listitem').filter({ hasText: BUDGET_WARNING_PREFIX });

  private readonly spendTile = () => this.page.getByTestId('savings_estimate_cards');

  constructor(options: TestContextOptions) {
    super(options);
  }

  @step
  async goto(): Promise<void> {
    await this.dismissTourOverlayWhenShown();
    await this.page.goto(this.buildUrl('/menu'));
    await expect(this.spendTile(), 'weekly spend tile of the menu screen').toBeVisible();
  }

  @step
  async expectNoBudgetWarning(): Promise<void> {
    await expect(this.budgetWarnings(), 'budget warnings of the menu screen').toHaveCount(0);
  }

  @atc('UI-TC-17-1')
  async showCurrentWeekBudgetWarning(budget: number): Promise<MenuBudgetWarning> {
    const tileText = await this.spendTile().innerText();
    const amount = SPEND_AMOUNT.exec(tileText);
    expect(amount, `amount in the spend tile "${tileText}"`).not.toBeNull();
    const cost = Number(`${amount?.[1].replaceAll('.', '')}.${amount?.[2]}`);
    expect(cost, `weekly cost against a budget of ${budget}`).toBeGreaterThan(budget);

    const warning = budgetWarningText(toCents(cost - budget));
    await expect(this.budgetWarnings(), `budget warning for a cost of ${cost} and a budget of ${budget}`).toHaveText([warning]);

    return { cost, warning };
  }
}
