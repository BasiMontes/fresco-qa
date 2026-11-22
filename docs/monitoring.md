# Synthetic monitoring

Synthetic checks of the hosted staging environment. Source: `monitoring/synthetic.ts`, run by `.github/workflows/monitoring.yml`.

## 1. Purpose and scope

- Watched target: hosted staging (the web app and its Supabase API). The script forces `TEST_ENV=staging` and resolves both URLs through `config/variables.ts`.
- No login is exercised: the staging login form and auth API require a captcha that automation cannot solve (`docs/bitacora.md`, entry of 2026-11-19).
- Every request is a read-only, unauthenticated `GET`. The API checks send only the public anon key.

## 2. The checks

The four checks run in parallel. A check passes only when the HTTP status is 200, its content assertion holds and the latency is within the budget. Request timeout: 10 000 ms. Latency budget (`LATENCY_BUDGET_MS`): 5 000 ms.

| Check | Path | Pass condition | A failure means |
|---|---|---|---|
| Web home responds | `/` | 200 | The web app is down or unreachable |
| Login page renders form | `/login` | 200 and the HTML contains `email_input` and `password_input` test ids | The login page is broken or serves something else |
| Supabase Auth health | `/auth/v1/health` | 200 | The auth service is down |
| Recipe catalogue readable | `/rest/v1/recipes` (first 5 rows) | 200, a non-empty JSON list whose first row has `id`, `nombre`, `alergenos`, `dieta` | The API, the data or the contract of the catalogue changed |

A request that throws (timeout, network error) is reported with status `ERR` and the error name as reason.

## 3. Schedule and trigger

- Schedule: cron `*/30 * * * *` (every 30 minutes, UTC).
- Manual: `workflow_dispatch`.
- Job timeout: 5 minutes. The key is read from the repository secret `STAGING_SUPABASE_ANON_KEY`.

## 4. Metrics

| Scope | Metric | Definition |
|---|---|---|
| Per check | HTTP status | Status code returned, or `ERR` if no response |
| Per check | Latency (ms) | Time from request start to the full body read, rounded |
| Per check | Result and reason | `PASS` with `ok`, or `FAIL` with the reason (`expected 200, got N`, the assertion message, `latency Nms over 5000ms budget`, or the error name) |
| Per run | Overall result | Pass when zero checks failed. Last line: `All checks passed` or `N of 4 checks failed` |
| Per run | Exit code | 0 when all pass, 1 otherwise or if the key is missing |

All metrics live only in the job log of each run, printed as a table (check, path, status, ms, result, reason). No history, trend or dashboard exists; comparing runs means opening their logs.

## 5. Alerts

An alert is a failed run, that is, exit code 1 from any of these causes:

- a check returns a status other than 200;
- a content assertion fails;
- a check is over the 5 000 ms budget;
- a request errors or times out;
- `STAGING_SUPABASE_ANON_KEY` is empty (the script prints `Missing STAGING_SUPABASE_ANON_KEY` and stops before any check).

It surfaces as a red run in GitHub Actions. Verified with `gh run list --workflow=monitoring.yml --limit 10`:

| Event | Conclusion | Runs seen |
|---|---|---|
| `workflow_dispatch` | success | 1 |
| `schedule` | none | 0 |

No run with event `schedule` has been observed, so the automatic trigger has not been seen to fire. The one manual dispatch run passed. No failed run exists, so no failure notification has been observed.

Notification delivery (for example e-mail on a failed scheduled run) depends on each person's GitHub notification settings and was not verified. No other alert channel is configured.

## 6. Known limits

- Single region: the run executes on a GitHub-hosted runner (the log of the dispatch run shows region `westcentralus`).
- No login flow, so authenticated paths (menus, orders, roles) are not covered.
- No alert routing beyond GitHub Actions.
- No metric storage or trend.
- The 5 000 ms budget was raised after earlier runs (commit `8d17f9a`). The log of the dispatch run shows per-check latencies from 709 ms to 2650 ms; this is one run, not a distribution.

## 7. Run it locally

```bash
bun run monitoring:synthetic
```

It needs the variable `STAGING_SUPABASE_ANON_KEY` set in the environment of the command that runs the script `monitoring:synthetic` (it runs with `--no-env-file`, through `scripts/launch.ts`, so the owner sets the variable for that one command instead of relying on a `.env` file). Without it the run exits with code 1.
