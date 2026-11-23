# DOJO project: allergy-safe weekly menu (draft)

Draft for the portfolio project page (QAFRESCO-20). Text in square brackets is for the owner to fill in; every number comes from the repository and names its source.

## Context

| Item | Value |
|---|---|
| Application | Fresco, a weekly menu planner for families, tested as a black box |
| Feature | Allergy-safe weekly menu: the menu excludes the declared allergens and respects the diet |
| Role | QA engineer: analysis, exploratory testing, automation, CI and monitoring |
| Duration | [owner: dates or weeks] |
| Stack | Playwright, TypeScript, Bun, KATA architecture, GitHub Actions, local Supabase stack |

The feature had no Story or specification, so the acceptance criteria were derived from the product itself: 11 criteria plus a security criterion (`docs/feature-test-plan.md`).

## Phase 1: analysis

- A feature test plan with scope, risks, personas and test design techniques (equivalence partitioning, boundary values, decision tables, state transition).
- 18 test cases, each tied to a criterion and a priority (`docs/test-cases.md`).
- A traceability matrix that maps every criterion to its cases, its automated checks and the defects found, and shows the gaps (`docs/traceability-matrix.md`).

## Phase 2: exploratory testing

- Three session reports, one each for the database, the UI and the API (`docs/session-reports/`).
- 9 candidate defects with severity and evidence level; 5 are linked to Jira issues and the rest are pending the product owner (`docs/bugs-found.md`).
- Examples: a vegan diet that silently stores allergens the user never chose, and a menu over the weekly budget that shows no warning.

## Phase 3: automation, CI/CD and monitoring

| Result | Value | Source |
|---|---|---|
| UI tests | 6 (UI-TC-01, 03, 05, 09, 11, 14) | `kata-manifest.json` |
| API tests | 21 ATCs across 7 files | `docs/automation-eval.md` section 1 |
| Test cases automated | 10 of 18 | `docs/automation-eval.md` section 2.1 |
| CI run on a fresh database | 51 of 51 passing, 0 skipped | GitHub Actions run 45152503321 |
| Scheduled run | The tests also run nightly | `.github/workflows/tests.yml` |
| Synthetic monitor of staging | 4 checks every 30 minutes | `docs/monitoring.md` |

The tests never share state: each one creates and deletes its own menu and restores the profile it changed, and they respect the product's limit of five menu generations per user and hour.

## Learnings

- The first CI run on an empty database failed 2 of 43 tests. An isolation check had passed locally only because earlier manual sessions had left data behind. A CI run on a fresh database is the only proof that a test does not depend on leftovers.
- A Playwright `testIgnore` set on one project replaces the global one instead of adding to it, which made some files run in no project at all.
- A review found credentials written into the report files. The fix was checked with a real login and zero sensitive files, and the published results page is a summary rather than the full report.
- A test that reports "passed" after being rate limited would be worse than none, so a rate-limited test reports "not run".
- [owner: personal reflection on the DOJO]

## Links

- Repository: https://github.com/BasiMontes/fresco-qa
- Results page: https://basimontes.github.io/fresco-qa/
- CI pipeline: https://github.com/BasiMontes/fresco-qa/actions/workflows/tests.yml
- Jira board: https://basiliomontescastano.atlassian.net/jira/software/projects/QAFRESCO/boards/36
