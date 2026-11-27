import type { TestContextOptions } from '@TestContext';

import { CalendarPage } from '@ui/CalendarPage';
import { ExamplePage } from '@ui/ExamplePage';
import { LoginPage } from '@ui/LoginPage';
import { MenuPage } from '@ui/MenuPage';
import { OnboardingPage } from '@ui/OnboardingPage';
import { PreferencesPage } from '@ui/PreferencesPage';
import { ProfilePage } from '@ui/ProfilePage';
import { RecipesPage } from '@ui/RecipesPage';
import { UiBase } from '@ui/UiBase';

export class UiFixture extends UiBase {
  readonly login: LoginPage;

  readonly example: ExamplePage;

  readonly calendar: CalendarPage;

  readonly menu: MenuPage;

  readonly onboarding: OnboardingPage;

  readonly preferences: PreferencesPage;

  readonly profile: ProfilePage;

  readonly recipes: RecipesPage;

  constructor(options: TestContextOptions) {
    super(options);

    this.login = new LoginPage(options);
    this.example = new ExamplePage(options);
    this.calendar = new CalendarPage(options);
    this.menu = new MenuPage(options);
    this.onboarding = new OnboardingPage(options);
    this.preferences = new PreferencesPage(options);
    this.profile = new ProfilePage(options);
    this.recipes = new RecipesPage(options);
  }
}
