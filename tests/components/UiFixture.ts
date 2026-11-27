import type { TestContextOptions } from '@TestContext';

import { CalendarPage } from '@ui/CalendarPage';
import { ExamplePage } from '@ui/ExamplePage';
import { LoginPage } from '@ui/LoginPage';
import { MenuPage } from '@ui/MenuPage';
import { PreferencesPage } from '@ui/PreferencesPage';
import { RecipesPage } from '@ui/RecipesPage';
import { UiBase } from '@ui/UiBase';

export class UiFixture extends UiBase {
  readonly login: LoginPage;

  readonly example: ExamplePage;

  readonly calendar: CalendarPage;

  readonly menu: MenuPage;

  readonly preferences: PreferencesPage;

  readonly recipes: RecipesPage;

  constructor(options: TestContextOptions) {
    super(options);

    this.login = new LoginPage(options);
    this.example = new ExamplePage(options);
    this.calendar = new CalendarPage(options);
    this.menu = new MenuPage(options);
    this.preferences = new PreferencesPage(options);
    this.recipes = new RecipesPage(options);
  }
}
