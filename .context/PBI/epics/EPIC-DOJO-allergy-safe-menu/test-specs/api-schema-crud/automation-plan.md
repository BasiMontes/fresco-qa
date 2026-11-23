# Automation plan: response schemas and CRUD edge cases (QAFRESCO-26)

Goal: API tests that check status, body and schema, and cover the create, read, update and delete operations the product exposes, with edge cases. Owner decision: schemas with zod (new dev dependency).

TC source gate: not applicable. Test cases live in `docs/test-cases.md`, not in Jira (`docs/automation-eval.md` section 1). These ATCs use the `CHK-` prefix because they come from an assessment, not from a test case.

## Assessment before the change

| Level | State |
|---|---|
| Status | Checked by every ATC |
| Body | Partial: single fields, empty lists, error messages. Never the whole row shape |
| Schema | None at run time; `api/schemas/*.types.ts` are hand-written and only compile-time. The product is Supabase and ships no OpenAPI file in the repo, so there are no generated types |

## Design

| Piece | Where |
|---|---|
| Runtime schemas (zod, loose objects so extra columns do not fail) | `api/schemas/profiles.schema.ts`, `menu.schema.ts`, `recipes.schema.ts`; each `satisfies` the matching hand-written type |
| Assertion helper with a readable path to the failing field | `tests/utils/schema.ts` (`expectMatchesSchema`) |
| Schema check inside the existing steps `listOwnMealPlans` and `getMealPlanRecipes`, so every menu test validates rows at no extra cost | `MealPlansApi` |

## New ATCs (10, none spends generation quota except CHK-E8)

| ATC | Operation | Technique | Expected (probed live before writing) |
|---|---|---|---|
| `CHK-S1` | Read own profile | Schema | 200, one row matching the schema, id is the caller |
| `CHK-S2` | Read catalogue | Schema | 200, non-empty, each row matches the schema |
| `CHK-E1` | Read recipe by unknown uuid | EP, with a positive control | 200 and `[]` |
| `CHK-E2` | Read recipe by malformed id | EP invalid | 400, code `22P02` |
| `CHK-E3` | Select an unknown column | EP invalid | 400, code `42703` |
| `CHK-E4` | Range beyond the catalogue | BVA | 416, code `PGRST103`, `Content-Range: */<total>` |
| `CHK-E5` | Update profile with an invalid value | EP, parameterized (3 rows) | 400 with `22P02` (list as string, diet flag not boolean) or `PGRST204` (unknown column); profile unchanged |
| `CHK-E6` | Insert a profile that already exists | State | 409, code `23505`; profile unchanged |
| `CHK-E7` | Delete an unknown meal plan | EP | 200 and `[]`; own plans unchanged |
| `CHK-E8` | Delete own menu | Positive | 200, the plan is returned, plan and slots are gone |

## Coverage of CRUD after the change

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| Profile | `CHK-E6` (duplicate) | `CHK-S1`, `CHK-A1` | `TC-08-1`, `TC-08-2`, `CHK-E5` | not exercised: a delete probe on the persona would break it, and account deletion (TC-12) is not automated |
| Menu | `TC-01`, `TC-02`, `TC-03`, `CHK-D1`, `CHK-D2`, `CHK-D3` | the menu steps, schema-checked | through the UI only (`UI-TC-09`) | `CHK-E7`, `CHK-E8` |
| Recipes | read-only for users | `CHK-S2`, `CHK-E1` to `CHK-E4` | not applicable | not applicable |

## Quota

`CHK-E8` spends 1 generation for `familia` (now `CHK-A2`, `UI-TC-11`, `UI-TC-09`, `CHK-E8`: 4 of 5 per hour).

## Done when

- [x] Types, lint and `kata:manifest:check` clean; all new tests pass locally.
- [x] Mutation check: a wrong schema type makes `CHK-S1` fail and names the field.
- [ ] Pass in CI on a fresh database.
