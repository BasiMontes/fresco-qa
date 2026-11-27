# Spec: TC-16, diets add only the allergens they should

Source: TC-16 in `docs/test-cases.md`, AC-1 and AC-8 in `docs/feature-test-plan.md`. Defects covered: BUG-01 (QAFRESCO-29) and BUG-14 (QAFRESCO-37), both fixed.

No signed ROI verdict exists; that gate was waived for this project (`docs/automation-eval.md` section 8).

## Scenarios

| ATC | Precondition | Action | Expected |
|---|---|---|---|
| `UI-TC-16-1` | New account on the diet step of the onboarding, no allergen chosen | Choose diets and open the summary | The summary lists exactly the allergens that contradict those diets, the step stays blocked until the health-data consent, and the finished profile stores exactly those diets and allergens |
| `UI-TC-16-2` | New account on the diet step | Choose allergens by hand, one of them also implied by a diet, and switch diets on and off | What a diet added leaves with it; what was chosen by hand stays, and only that is stored |
| `UI-TC-16-3` | Finished profile with a diet and its saved allergen | Switch the diet off in the preferences and save | The allergen stays selected, unlocked, and stored; the diet is not stored |
| `UI-TC-16-4` | Preferences of a finished profile | Switch another diet on and off | Its allergen is selected and locked while on, and not selected after |

## Data variants

| ATC | Diets | Expected allergens |
|---|---|---|
| `UI-TC-16-1` | vegan and lactose-free | `huevo`, `pescado` |
| `UI-TC-16-1` | vegetarian | `pescado` |
| `UI-TC-16-2` | vegan, vegetarian and gluten-free switched on and off, then vegetarian over a hand-chosen `pescado` | `sulfitos` and `pescado`, chosen by hand |
| `UI-TC-16-3` | vegetarian | `pescado` |
| `UI-TC-16-4` | gluten-free | `gluten` selected, then not |

Equality with the expected list also proves that `sulfitos` is not added.

## Oracle

The product owner decision of 2026-11-23 (an implied allergen is accepted only when it contradicts the diet) and the agreed result of BUG-14: only what the diet added in the current edit leaves with it; a saved allergen stays.

## Out of scope

Removing a saved allergen by hand, the keto and halal diets, free-text diets, an account that signs up without the onboarding.
