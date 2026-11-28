import type { TestContextOptions } from '@TestContext';
import type { ScreenAisle } from '@utils/shoppingScale';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

const GENERATION_TIMEOUT_MS = 30_000;
const ITEM_NAME = '[id^="shopping_list_item_"][id$="_name"]';

export class ShoppingListPage extends UiBase {
  private readonly aisles = () => this.page.locator('[data-tour="shopping-list"] div:has(> h3)').filter({ has: this.page.locator(ITEM_NAME) });

  constructor(options: TestContextOptions) {
    super(options);
  }

  @step
  async openGeneratedList(): Promise<void> {
    await this.dismissTourOverlayWhenShown();
    await this.page.goto(this.buildUrl('/shopping-list'));
    await expect(this.aisles(), 'aisles of the generated shopping list').not.toHaveCount(0, { timeout: GENERATION_TIMEOUT_MS });
  }

  @atc('UI-TC-07-1')
  async showStoredRowsGroupedByAisle(expected: ScreenAisle[]): Promise<void> {
    expect(expected.length, 'aisles of the stored list').toBeGreaterThan(1);
    await expect.poll(async () => this.readAisles(), { message: 'aisles, ingredients and quantities on the list screen' }).toEqual(expected);
  }

  private async readAisles(): Promise<ScreenAisle[]> {
    return this.aisles().evaluateAll((sections, itemName) => {
      const shownText = (element: Element | null | undefined): string =>
        element?.checkVisibility({ opacityProperty: true, visibilityProperty: true })
          ? (element.textContent ?? '').replace(/\s+/g, ' ').trim()
          : '';
      return sections.map(section => ({
        aisle: shownText(section.querySelector('h3')),
        rows: Array.from(section.querySelectorAll(itemName), name => ({
          name: shownText(name),
          quantity: shownText(name.parentElement?.parentElement?.querySelector(':scope > span')).split('·')[0].trim(),
        })),
      }));
    }, ITEM_NAME);
  }
}
