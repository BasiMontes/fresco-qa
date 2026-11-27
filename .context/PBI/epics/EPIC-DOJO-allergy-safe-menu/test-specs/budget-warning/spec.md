# Spec: TC-17, over-budget menu warning

Source: TC-17 in `docs/test-cases.md`, AC-11 in `docs/feature-test-plan.md`. Defects covered: BUG-02 (QAFRESCO-2) and BUG-13 (QAFRESCO-36), both fixed.

No signed ROI verdict exists; that gate was waived for this project (`docs/automation-eval.md` section 8).

## Scenarios

| ATC | Precondition | Action | Expected |
|---|---|---|---|
| `UI-TC-17-1` | Current week's menu costs more than the budget | Open the menu screen | A warning states cost minus budget, equal to the spend tile minus the budget |
| `UI-TC-17-2` | Next week's menu costs more than the budget | Open the calendar for that week, without opening the menu screen | A warning states the excess |
| `UI-TC-17-3` | Budget equal to the cost of a menu | Open the calendar for that week | No budget warning |

## Data variants (boundaries)

| Budget | Week | Expected |
|---|---|---|
| 1 EUR | current, next | warning |
| cost minus 0.01 | current, next | warning of 0.01 |
| cost | current, next | no warning |

The stored `meal_plans.advertencias` must match the screen in every row. For the current week the calendar must show the same warning as the menu screen.

## Oracle

- Current week: the cost comes from the spend tile, a second display of the same estimate.
- Next week: the app shows no cost. The test derives it as budget plus excess from the first warning and checks the threshold around it.
- The amount of the next week is therefore not verified on its own: an error that shifts both the amount and the threshold by the same figure would pass.
- Whether the estimate itself is right is out of scope: no price specification exists.

## Out of scope

Past weeks (stored warning kept), unrelated warnings, a profile without a budget, changing the budget through the interface.
