# Automation plan: UI tests 5 and 6 (QAFRESCO-25)

Goal: reach six passing UI tests in CI (four exist). Scope: `UI-TC-05` (new plan below) and `UI-TC-09` (plan already approved in `../menu-safety-p1-gaps/atc/UI-TC-09.md`, owner confirmed the run as `familia` with `huevo` written for the run).

TC source gate: not applicable. This project keeps its test cases in `docs/test-cases.md`, not as Jira Tests (owner decision, `docs/automation-eval.md` section 1).

## Candidates considered

| TC | Decision | Reason |
|---|---|---|
| TC-09 | Automate as `UI-TC-09` | P1, closes the AC-4 gap. Covers the add-to-menu flow only; PO-1 (what "swap" means) stays open |
| TC-05 | Automate as `UI-TC-05` | P3, cheap, reuses `PreferencesPage` |
| TC-12 | Out | Needs a disposable account and the delete flow was never exercised |
| TC-07 | Out | The scaling rule is undocumented, so there is no oracle |

## UI-TC-05: declareLupinAllergen

| Field | Value |
|---|---|
| Component | `PreferencesPage` (existing), new ATC `UI-TC-05` `saveLupinAllergen` |
| Fixture and persona | `{ test }`, persona `vegano`, which had room at the time of this plan |
| Technique | EP: a declarable allergen that no recipe carries (`altramuces`, F-06) |
| Test file | `tests/e2e/menu-safety/declareLupinAllergen.test.ts` |

Flow:

1. Precondition through the API: profile has no `altramuces`; no menu for the drawn week.
2. UI: login, open `/profile/preferences`, ATC clicks the `Altramuces` chip, saves, sees the saved message.
3. Reload persistence step; API readback: `alergenos` contains `altramuces`.
4. API generates a menu for a free future week (1 generation, `runUnlessRateLimited`) and reads it: 21 slots, every one with a recipe, none carrying `altramuces` (documented limit: no recipe is tagged, so the exclusion itself is not provable) and none breaking the vegan and lactose-free diets.
5. Cleanup in `finally`: delete the created menu and assert no leftovers, then restore the dietary preferences (`withDietaryPreferencesRestored`).

Fixed assertions inside the ATC: chip enabled and pressed after the click, save enabled, saved message visible, checkout dialog hidden.

## Quota

| Persona | Per run today | Added | Total |
|---|---|---|---|
| `vegano` | `TC-03` + `UI-TC-03` + `CHK-A2` = 3 | `UI-TC-05` = 1 | 4 of 5 |
| `familia` | `UI-TC-11` + `CHK-A2` + two `CHK-D2` rows = 4 | `UI-TC-09` = 1 | 5 of 5 |

## Done when

- [x] `UI-TC-05` and `UI-TC-09` pass locally, twice in a row, leaving no menu and an unchanged profile.
- [x] `bun run test`, `types:check`, `lint:check`, `kata:manifest:check` clean.
- [x] Both pass in CI on a fresh database: run 45152503321, 51 of 51.
