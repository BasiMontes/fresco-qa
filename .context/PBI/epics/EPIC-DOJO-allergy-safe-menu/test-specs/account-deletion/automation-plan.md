# Automation plan: TC-12

## Accounts

Each test creates its own account through the onboarding, registered or guest. The account the test deletes is always one it created.

## Reading the database

After a deletion no user exists to read with. The owner approved, on 2026-11-27, a read of the local database with the service role key, under these limits:

- Only `GET` requests.
- The component refuses to run when the API address is not local.
- The key is read from `SUPABASE_SERVICE_ROLE_KEY`, which the CI workflow already exports for seeding.
- The key is never used to sign in and is not part of the published results page.
- Owner decision of 2026-11-27, after the review: the key may appear in the Playwright trace and call log of a failing run, which CI uploads in the `test-reports` artifact of this public repository. This replaces the earlier limit that kept it out of logs and report attachments. It is accepted for the key of a disposable local stack only; the key of a hosted project must never be placed in `SUPABASE_SERVICE_ROLE_KEY`. The behaviour comes from the review's reading of Playwright and was not reproduced, and whether the local key is the Supabase default was not checked.

## Changes

| File | Change |
|---|---|
| `config/variables.ts` | Read the service role key at the point of use |
| `tests/components/api/ErasureApi.ts` (new) | Count the rows of a user and read the erasure record |
| `tests/components/api/AuthApi.ts` | Step: sign-in is rejected |
| `tests/components/ui/OnboardingPage.ts` | Continue as guest; return the id of the account when finishing |
| `tests/components/ui/ProfilePage.ts` (new) | `UI-TC-12-1`, `12-2`, `12-3` |
| `tests/components/ApiFixture.ts`, `UiFixture.ts` | Register them |
| `tests/e2e/menu-safety/deleteAccountData.test.ts` (new) | Three tests |
| `kata-manifest.json`, `docs/`, `README.md` | Regenerate, name the variable in the README, update counts, correct the expected result of TC-12 |

## Verification

1. All tests pass twice on the current product.
2. No version is known to be broken, so they are proved on altered product copies: one that reports a deletion without deleting must fail `12-1` and `12-2`; one that deletes without checking the password must fail `12-3`.
3. No check that the key stays out of the reports: see the owner decision above.
4. Count of sign-ups and sign-ins in a full run, against the limit of 30 per 5 minutes.
5. Full integration and e2e run, `types:check`, `lint:check`, `kata:manifest:check`.
6. One separate reviewer on the diff before the push.

## Risks

- The local configuration allows 30 sign-ups and sign-ins per 5 minutes. A full run made 34 requests to those endpoints, and none was refused in the two runs where they were counted; why is not known. Owner decision of 2026-11-27: change nothing and record it. A refusal with status 429 in CI would be handled then.
- The deletion function stops when a billing key is present and invalid. If the local functions receive one, a registered account cannot be deleted.
- Each local run leaves one account (the wrong-password one).
