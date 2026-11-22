import type { GenerateMealPlanPayload } from '@schemas/menu.types';
import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';
import { RateLimitError } from '@utils/quota';

export type SlotNames = Record<string, string>;

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
const MEALS = ['desayuno', 'comida', 'cena'] as const;
const GENERATE_ENDPOINT = /\/functions\/v1\/generate-meal-plan/;
const GENERATION_TIMEOUT = 60000;
const LUNCH_AND_DINNER_SLOTS = 14;

export class CalendarPage extends UiBase {
  private readonly slot = (dia: string, tipo: string) => this.page.getByTestId(`calendar_slot_${dia}_${tipo}`);

  constructor(options: TestContextOptions) {
    super(options);
  }

  private async generateAndReadSlots(week: GenerateMealPlanPayload): Promise<SlotNames> {
    const generation = await this.interceptResponse({
      urlPattern: GENERATE_ENDPOINT,
      timeout: GENERATION_TIMEOUT,
      action: async () => {
        await this.page.getByTestId('generate_week_button').click();
      },
    });
    if (generation.status === 429) {
      throw new RateLimitError(`generate-meal-plan answered 429 for ${week.semana_iso}`);
    }
    expect(generation.status, `generate-meal-plan status for ${week.semana_iso}`).toBe(200);

    await expect(
      this.slot(DAYS[0], MEALS[0]),
      `menu grid after generation of ${week.semana_iso}`,
    ).toBeVisible();

    const names: SlotNames = {};
    for (const dia of DAYS) {
      await this.revealDay(dia);
      for (const tipo of MEALS) {
        const name = this.slot(dia, tipo).locator('h2');
        await expect(name, `recipe name in ${dia} ${tipo} of ${week.semana_iso}`).toHaveText(/\S/);
        names[`${dia}_${tipo}`] = (await name.innerText()).trim();
      }
      await expect(
        this.page.getByTestId(new RegExp(`^calendar_slot_${dia}_(desayuno|comida|cena)_(sin_receta|excluida)$`)),
        `empty slot markers in ${dia} of ${week.semana_iso}`,
      ).toHaveCount(0);
    }
    return names;
  }

  private async revealDay(dia: string): Promise<void> {
    const nextDay = this.page.getByTestId('calendar_day_nav_next');
    const breakfasts = this.page.getByTestId(/^calendar_slot_[a-z]+_desayuno$/);
    const renderedDays = async (): Promise<string> =>
      breakfasts.evaluateAll(elements => elements.map(element => element.getAttribute('data-testid')).join('|'));
    for (let step = 0; step < DAYS.length; step++) {
      if (await this.slot(dia, 'desayuno').count() > 0) {
        return;
      }
      const before = await renderedDays();
      await expect(nextDay, `day navigation to reach ${dia}`).toBeEnabled();
      await nextDay.click();
      await expect.poll(renderedDays, { message: `calendar window moved after navigating towards ${dia}` }).not.toBe(before);
    }
    await expect(this.slot(dia, 'desayuno'), `${dia} reachable through day navigation`).toBeVisible();
  }

  @step
  async goto(week: GenerateMealPlanPayload): Promise<void> {
    await this.dismissTourOverlayWhenShown();
    await this.page.goto(this.buildUrl(`/calendar?semana=${week.semana_iso}`));
    await expect(this.page.getByTestId('generate_week_button'), `generate button for ${week.semana_iso}`).toBeEnabled();
  }

  @atc('UI-TC-01')
  async generateMenuForEggAllergicPersona(week: GenerateMealPlanPayload): Promise<SlotNames> {
    return this.generateAndReadSlots(week);
  }

  @atc('UI-TC-03')
  async generateMenuForVeganLactoseFreePersona(week: GenerateMealPlanPayload): Promise<SlotNames> {
    return this.generateAndReadSlots(week);
  }

  @atc('UI-TC-11')
  async generateFullWeekWithoutRepeatedMeals(week: GenerateMealPlanPayload): Promise<SlotNames> {
    const names = await this.generateAndReadSlots(week);

    const mainMeals = DAYS.flatMap(dia => [names[`${dia}_comida`], names[`${dia}_cena`]]);
    expect(mainMeals, `comida and cena slots in ${week.semana_iso}`).toHaveLength(LUNCH_AND_DINNER_SLOTS);
    expect(new Set(mainMeals).size, `distinct comida and cena names in ${week.semana_iso}`).toBe(LUNCH_AND_DINNER_SLOTS);

    return names;
  }
}
