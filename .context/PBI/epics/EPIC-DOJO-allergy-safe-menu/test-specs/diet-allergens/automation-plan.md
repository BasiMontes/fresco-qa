# Automation plan: TC-16

## Accounts

Each test signs up its own account through the onboarding form, with a generated email and password. No persona is read or written, so no new variable is needed and no other test is affected.

## Changes

| File | Change |
|---|---|
| `tests/components/ui/OnboardingPage.ts` (new) | Create the account, choose diets and allergens, finish, skip the tour; `UI-TC-16-1` and `UI-TC-16-2` |
| `tests/components/ui/PreferencesPage.ts` | `UI-TC-16-3` and `UI-TC-16-4` |
| `tests/components/UiFixture.ts` | Register `onboarding` |
| `tests/e2e/menu-safety/keepDietAllergensHonest.test.ts` (new) | Four tests: two rows of `UI-TC-16-1`, one of `UI-TC-16-2`, one with `UI-TC-16-4` and `UI-TC-16-3`. Fixture `{ test }`, 150 s timeout because each test waits for a menu generation |
| `kata-manifest.json`, `docs/`, `README.md` | Regenerate and update counts and status |

The stored profile is read through the API after signing in with the same generated credentials (`AuthApi.signInWithPassword`, `ProfilesApi.getOwnProfile`). No admin key is used.

## Verification

1. Red before green: every test fails on `0d3ff944`, before the BUG-01 fix; the tests of `UI-TC-16-2` and of the preferences fail on `8575a2d9`, before the BUG-14 fix.
2. The hand-chosen cases and `UI-TC-16-3` check behaviour that no released version broke, so they are proved on a copy of the product altered so that a diet claims hand-chosen allergens: both tests must fail.
3. All tests pass twice on the current product.
4. Full integration and e2e run, `types:check`, `lint:check`, `kata:manifest:check`.
5. One separate reviewer on the diff before the push.

## Risks

- The sign-up form checks the password against an external breached-password service. The product continues if it does not answer.
- Each run leaves four accounts in a local database; the suite has no safe way to delete them. CI starts from an empty database.
- The local stack allows 30 sign-ups and sign-ins per 5 minutes and address; a full run uses most of them, so two runs in a row may be refused.
- The generated password is typed in a form, so it appears in the local Playwright report and in the `test-reports` artifact of CI. It is not in the published results page. The accounts are throwaway and local.
- Finishing the onboarding generates a menu, so each test waits for a generation. The quota is per user and these users are new.
- The tests only make sense on a local stack: hosted sign-up needs a captcha.
