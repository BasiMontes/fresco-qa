# API testing session

| Field | Value |
|---|---|
| Date | 2026-11-19 |
| Target | The product API on a local stack: Supabase REST (PostgREST), Supabase Auth and the product's edge functions |
| Tokens | Minted with `bun run api:login local --role <role>` for the three personas, after adapting the repository configuration to the product's auth endpoint |
| Requests | Sent from a script with `fetch`. The repository doctrine names `curl`; the HTTP calls are the same and the two examples in section 6 reproduce them |
| Charter | Check that the API enforces who can read and change a user's profile and menus, that the filter RPC is owner-only, and that menu generation validates its input and stays safe for an allergic profile |

## 1. Setup

- The repository configuration pointed to the boilerplate's example endpoints. Two project-owned files were adapted: the environment map in `config/variables.ts` (local app, local Supabase, staging) and the auth adapter `scripts/api-login.project.ts` (the Supabase password grant `POST /auth/v1/token?grant_type=password` with the public key in an `apikey` header).
- Role credentials follow the repository convention `<ENV>_<ROLE>_EMAIL` and `<ENV>_<ROLE>_PASSWORD`, here `LOCAL_ALERGIA_`, `LOCAL_VEGANO_` and `LOCAL_FAMILIA_`. They live in `.env` and are never written in documents.
- The token files in `.auth/` are ignored by git and were restricted to owner-only permissions.
- Authenticated calls target the local stack only. Staging cannot issue a token without solving a captcha (see `ui-session.md`).

## 2. Contract found

| Endpoint | Behaviour |
|---|---|
| `POST /functions/v1/generate-meal-plan` | Body `{ semana_iso, fecha_inicio }`. One menu per user per ISO week: a second call for the same week returns 409. The result is deterministic per user and week |
| `POST /rest/v1/rpc/get_filtered_recipes` | Body `{ p_user_id }`. Returns the recipes that pass the profile's allergens and diets. Refuses a caller who is not the profile's owner |
| `GET /rest/v1/recipes` | Readable without a session, including inactive recipes |
| `user_profiles`, `meal_plans`, `meal_plan_recipes`, `user_consents` | Closed to anonymous callers; owner-only for a signed-in user |
| Rate limit on `generate-meal-plan` | 5 per hour per user, with a fixed hourly window |

## 3. Anonymous checks

Sent with the public key and no session.

| Check | Expected | Result |
|---|---|---|
| Read `user_profiles`, `meal_plans`, `meal_plan_recipes`, `user_consents` | Denied | 401 permission denied on all four |
| Call `get_filtered_recipes` | Denied | 401 permission denied |
| Call `generate-meal-plan` and `delete-account` without a user token | Denied | 401 "No autorizado" |
| Read the `recipes` catalogue | Allowed | 200 |
| Read `recipes` with `activo=false` | Question for the PO | 200, an inactive recipe is returned |

## 4. Authenticated checks

Run as persona A (`ALERGIA`) against personas B and C. 17 of 18 checks passed; the one that did not is explained after the table.

| ID | Check | Expected | Result |
|---|---|---|---|
| A1 | List own profiles | 1 row | Passed, 1 row |
| A2 | Read another user's profile | 0 rows | Passed, 0 rows |
| A3 | Read another user's menus | 0 rows | Passed, 0 rows |
| A4 | Read another user's consents | 0 rows | Passed, 0 rows |
| A5 | Change another user's profile | 0 rows changed | Passed, 0 rows |
| A6 | The victim's profile after A5 | Unchanged | Passed |
| B1 | RPC with another user's id (TC-15) | Error, caller does not own the profile | Passed: 400 "caller does not own profile" |
| B2 | RPC with own id | 562 recipes | Passed, 562, the same count the UI showed |
| B3 | RPC for persona B | 267 recipes | Passed, 267, the same count the UI showed |
| C1 | Tampered token on REST | 401 | Passed |
| C2 | Tampered token on an edge function | 401 | Passed |
| D1 | Generate with an empty body | 400 | Passed, names the missing fields |
| D2 | Generate for the invalid week 2026-W99 | 400 | Passed |
| D3 | Generate for a week that already has a menu | 409 | Passed |
| E1 | Generate 10 new weeks | 10 successes | **Not met**: 2 succeeded, the rest returned 429 |
| E2 | Egg recipes in the generated menus (TC-02) | 0 | Passed, 0 in 2 menus |
| E3 | Slots with a recipe in a future week | 21 | Passed, 21 of 21 in both |
| F1 | Owner deletes the generated menus | All deleted | Passed, 2 deleted |

E1 is not a product failure. The limit is 5 generations per hour, and the earlier checks and the onboarding generation in the same hour used part of it. TC-02 asked for 10 generations, which the limit makes impossible in one hour, so only 2 menus were checked. Both had no egg recipe.

E3 explains the 12 of 21 slots seen in the UI session: a menu for a future week has all 21 slots filled, and only the current week leaves the days already past empty.

## 5. Findings

None is confirmed as a defect. Each needs the PO's answer or a repeat.

| ID | Type | Finding | Evidence |
|---|---|---|---|
| API-01 | Question | The public catalogue includes inactive recipes (`activo=false`), readable without a session. Inactive recipes are those the product withdrew or has not published | Section 3 |
| API-02 | Observation | The owner check of the filter RPC answers 400 and not 403, and the message repeats the id supplied by the caller | B1 |
| API-03 | Observation | The generation limit of 5 per hour makes a repeated-generation regression check slow. Whether a rejected request, such as an empty body, also uses the quota was not isolated | E1 |
| API-04 | Context for U-03 | A future week has 21 filled slots; the partial menu seen in the UI session is specific to the current week, which the PO should still confirm | E3 |

## 6. Reproduce

```bash
bun run api:login local --role alergia
source .auth/tokens.env && curl -s -H "apikey: $LOCAL_SUPABASE_ANON_KEY" -H "Authorization: Bearer $API_TOKEN_ALERGIA_LOCAL" \
  "http://127.0.0.1:54321/rest/v1/user_profiles?select=id"
```

The second command returns one row, the caller's own profile. Replacing the filter by another user's id returns an empty list.

## 7. Not covered

- Calls on staging with a session, blocked by the captcha.
- The remaining edge functions: shopping list, slot status, export and account deletion.
- Behaviour after a token expires, and token refresh.
- Concurrent generation for the same week, which the function documents as a conflict.
- The 10-week repetition of TC-02, bounded by the hourly limit.
