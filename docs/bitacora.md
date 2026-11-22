# Bitácora: Fresco QA

Append-only project log. Every relevant milestone adds one entry at the bottom: what was done, why, what comes next. It exists so a new session does not re-derive the project from scratch.

## Rules

- **Append only.** Never edit, reorder or delete an earlier entry.
- **Append without reading.** Adding an entry never requires reading this file. Add the text at the end with a shell append (`printf '...' >> docs/bitacora.md`), nothing else. Read the file only when someone asks, or once at the start of a new session for context.
- **When to write.** When a deliverable is closed (a plan, a session report, a test suite, the pipeline), when a decision changes the course of the project, or when a bug is confirmed. Never for small edits, text tweaks or exploratory work with no result.
- **Entry format.** `## YYYY-MM-DD - short title`, then three lines: `**What**`, `**Why**`, `**Next**`. Entries are in English, carry no secrets, no emails and no passwords, and name sources by file path.
- **Rotation.** When the entry count passes 50, count with `rg -c '^## ' docs/bitacora.md` (a count, not a read), move the file to `docs/bitacora-<first-date>-to-<last-date>.md` and start a new one with this header and the last 15 entries.

---

## 2026-11-19 - Jira provisioned only as far as the course needs

**What**: Created the QA fields in Jira (acceptance test plan and results, AI effort, token usage, QA assignee) and found two projects: QAFRESCO (QA, empty) and FRESCO (the product, with its own project-scoped fields). The field catalog needed a manual swap of the ATP entry after each sync.
**Why**: The course rubric grades deliverables in the repository, not Jira structure. The only Jira item the delivery asks for is a link to a board.
**Next**: Do not provision the remaining 160-odd items of the Jira check. Link the QAFRESCO board in the README.

## 2026-11-19 - Feature Test Plan, test cases and the database session report

**What**: Wrote `docs/feature-test-plan.md` (11 acceptance criteria, 3 personas, risks, questions for the PO), `docs/test-cases.md` (18 cases) and `docs/session-reports/db-session.md` from read-only queries on the shared Supabase project.
**Why**: No Story or specification exists, so the criteria were derived from the public landing page, the FAQ and the database, and the uncertain ones are marked as needing PO confirmation.
**Next**: Keep every case traceable to a criterion. Findings stay candidates until reproduced.

## 2026-11-19 - Staging cannot be automated: captcha on the login form and on the auth API

**What**: The login form and the Supabase Auth password grant of fresco-pre both require a Cloudflare Turnstile token. An automated browser stays on the login page with "wait for the verification", and the API answers `captcha_failed`.
**Why**: The captcha protection belongs to the database project shared by every environment, so it cannot be turned off for staging alone.
**Next**: Authenticated tests run against a local copy of the product. Staging is used for public pages and read-only database checks.

## 2026-11-19 - Local stack and the three personas

**What**: Started the product locally (Docker, local Supabase, edge functions, web app with the public captcha site key empty) and created the personas alergia, vegano and familia through the real signup form. Documented in `docs/session-reports/ui-session.md` with 6 screenshots.
**Why**: The repository doctrine forbids creating the account a test runs as through an admin API in any environment.
**Next**: UI and API tests assume this stack. The pipeline has to start the same stack and create the personas.

## 2026-11-19 - UI and API session reports, with candidate findings

**What**: Wrote the UI and API session reports. The filter counts shown in the UI (562, 267 and 658 recipes) match an independent SQL computation, and 17 of 18 API checks passed. Candidate findings: allergens stored without the user choosing them when picking a vegan diet, a budget of 35 EUR with an estimate of 94.95 EUR and no warning, a recipe photo that shows egg on a recipe without egg, a menu generated mid-week that fills only the remaining days, and inactive recipes readable without a session.
**Why**: These are the discoveries the rubric asks for, but none is confirmed with the PO, so each is written as a candidate with its evidence.
**Next**: Reproduce each one, then record only the confirmed ones in a bugs report.

## 2026-11-19 - KATA API tests: 28 ATCs, reviewed twice, closed with waivers

**What**: Adapted the framework to the Supabase auth and wrote the API tests in `tests/integration/menu-safety/` (4 components, 6 files, per-role authentication, a quota helper). Two review rounds with four reviewers each found real defects, now fixed: credentials attached to Allure reports, a rate-limit skip that hid critical tests, quota files firing twice and vacuous isolation controls. All files pass locally and the plan is in `.context/PBI/epics/EPIC-DOJO-allergy-safe-menu/test-specs/api-menu-safety/`.
**Why**: Automation is a graded deliverable and the framework must follow the KATA architecture. Waivers owned by the project: test ids are not Jira keys, two ATCs are kept separate on purpose, and one chain of three ATCs lives in one test.
**Next**: Remove the boilerplate sample tests that fail on this backend, then write the UI tests and the pipeline. Copy the waivers into the automation evaluation document of the delivery.

## 2026-11-19 - Project log created with an append-only rule

**What**: Created `docs/bitacora.md` modelled on the product repository log, with its rules in the header and in the project-owned instructions, and seeded it with six entries from this session.
**Why**: A new session should recover the state of the project from one file without re-deriving it, and an append never needs to read the log.
**Next**: Add an entry when the UI tests, the pipeline and the final documents are closed.

## 2026-11-19 - Local stack went down; how to resume

**What**: At 14:08 UTC the Docker daemon stopped, taking down the local Supabase containers, the edge functions server and the web app. Code, documents, screenshots and memory are on disk; nothing is committed (about 30 paths pending). The API tests were verified passing before the stop.
**Why**: The cause is unknown (the app was closed, or the machine idled). Persona data and menus live in Docker volumes and should return on restart, which is unverified.
**Next**: Restart in this order and check each piece with a real request: start the Docker runtime, start the local Supabase containers, serve the edge functions, then start the web app with the public captcha site key empty (the first start exits once after a framework notice; run it again). Then write the 3 UI tests, remove the boilerplate sample tests, write the pipeline, the bugs report, the automation evaluation, the monitoring script and the README.

## 2026-11-22 - UI tests, CI pipeline, monitoring and defect list closed

**What**: Added four UI ATCs (UI-TC-01, 03, 11, 14), the `tests.yml` workflow that boots the local Supabase stack and seeds the personas, a synthetic monitor of staging, `docs/bugs-found.md` and `docs/automation-eval.md`. The first CI run (d603233) failed 2 of 43 because `CHK-A2` depended on menus left by manual sessions; the test now creates its own victim menu. The second run (2fcdde1) passed 43 of 43 on a fresh database.
**Why**: The delivery needs UI and API automation running in CI, a monitor and a defect list. A CI run on an empty database is the only proof that a test does not rely on leftover local state.
**Next**: Decide on the scheduled `smoke.yml` and `regression.yml` inherited from the boilerplate (they fail daily against staging), give `smoke-ui` a quota-free critical test, and build the presentation. Sources: `docs/automation-eval.md` section 5, `docs/bugs-found.md`.
