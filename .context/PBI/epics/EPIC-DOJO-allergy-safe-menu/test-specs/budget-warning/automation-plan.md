# Automation plan: TC-17

## Account

New persona `presupuesto`: no diet, no allergen, 2 adults, no budget stored.

No existing persona fits. `familia` already writes a menu on the current week (`UI-TC-09`) and `filterBySeveralAllergens` requires no menu from that week on; `familia` and `vegano` also use 5 of their 5 hourly generations. A budget write on a shared persona would leak into other tests. The new persona spends 2 of 5 per run.

## Changes

| File | Change |
|---|---|
| `config/variables.ts` | Add the role `presupuesto` |
| `scripts/ci/seed-personas.ts` | Seed it |
| `tests/components/api/ProfilesApi.ts` | Step `setWeeklyBudget(budget)` |
| `tests/components/api/MealPlansApi.ts` | Step that reads the stored budget warnings of a week |
| `tests/components/ui/MenuPage.ts` (new) | `UI-TC-17-1`, reads the spend tile and `menu_advertencias_banner` |
| `tests/components/ui/CalendarPage.ts` | `UI-TC-17-2`, `UI-TC-17-3`, reads `calendar_advertencias_banner` |
| `tests/components/UiFixture.ts` | Register `menu` |
| `tests/e2e/menu-safety/warnOverBudgetMenu.test.ts` (new) | Two tests: current week, next week. Fixture `{ test }` |
| `kata-manifest.json`, `docs/`, `README.md` | Regenerate and update counts and status |

## Data

Generated per run through the API, deleted afterwards; the budget is restored to empty. Menus of the current and next week left by an earlier run are deleted first, for this persona only. Random future weeks start two weeks ahead, so they never collide with these two.

## Verification

1. Red before green: the next-week test fails on fresco-app `8575a2d9` (before the BUG-13 fix).
2. Both tests pass twice on `08dda5d6`, leaving no menu and no budget.
3. Full integration and e2e run, `types:check`, `lint:check`, `kata:manifest:check`.
4. Separate verifier on the diff before the push.

## Risks

- A current-week menu generated late in the week has few dishes. The budgets are relative to the cost, so the cases still hold.
- The product and the test both take the current week from the date in Europe/Madrid. A run that crosses midnight into a Monday could still disagree.
- The persona has 5 generations per UTC hour and a run uses 2. In a third run within the hour the first test runs and the second is reported as not run.
