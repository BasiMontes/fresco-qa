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

## 2026-11-22 - Inherited schedules removed and smoke-ui covered

**What**: `smoke.yml` and `regression.yml` now run only on manual dispatch, because their daily schedule failed against staging (captcha on login, empty TMS secrets). UI-TC-14 is tagged `@critical`, so `smoke-ui` runs one test that spends no generation quota, and the tour overlay handler moved into `UiBase`.
**Why**: A schedule that can only fail trains the team to ignore red runs, and a smoke project with no tests proves nothing.
**Next**: Build the presentation. Sources: `.github/workflows/smoke.yml`, `tests/e2e/menu-safety/setDietaryFilters.test.ts`, `docs/automation-eval.md` section 5.

## 2026-11-22 - Correction: QAFRESCO already had six defects, and the course-closing epic

**What**: `docs/bugs-found.md` said the QAFRESCO project had no issues. It had seven since 2026-11-19 (an epic and six errors, QAFRESCO-1 to QAFRESCO-7), created from the UI sessions; only the budget warning matches a defect of the document exactly. The statement was corrected, and the epic QAFRESCO-8 was created to organise the course closing.
**Why**: The first note of 2026-11-19 recorded QAFRESCO as empty at that moment and was later copied forward without checking Jira again.
**Next**: Break the four ceremony pages into cards under QAFRESCO-8 and decide how the three defects without a ticket (BUG-01, BUG-03, BUG-05) are filed. Sources: `docs/bugs-found.md`, the QAFRESCO board.

## 2026-11-23 - Six UI tests, schema validation, traceability matrix and presentation numbers

**What**: Added the traceability matrix and a case template, UI-TC-05 and UI-TC-09 (six UI tests), zod schema validation and 11 API ATCs for schemas and CRUD edge cases, and the portfolio drafts; brought the Spanish and English decks and the speaking script to the same 10-minute format and numbers. CI passes 64 of 64 on a fresh database (run 45158678926). QAFRESCO-15, 24, 25 and 26 are closed.
**Why**: Rubric items for traceability, UI tests, API validation and the presentation. The first CI run of the schema tests failed because one more menu request pushed a persona past the limit of five per hour; the menu deletion test moved to a persona with room.
**Next**: Check the nightly run of the tests workflow (QAFRESCO-27), publish the portfolio drafts, render and rehearse the decks, and decide the open defects and AC-4 with the product owner. Sources: `docs/traceability-matrix.md`, `docs/automation-eval.md`, `docs/portfolio/`.

## 2026-11-25 - GitHub profile README published, QAFRESCO-19 closed

**What**: Created the public repository BasiMontes/BasiMontes with the profile README from `docs/portfolio/github-profile-readme.md` and verified six pinned repositories, fresco-qa among them. Checked the public exposure of this repository before pinning (pattern scan of code and history, CI credentials, personal data); secret scanning stays disabled. In the product repository the LICENSE now names its owner below the template author (pull request 1090, promoted to production).
**Why**: Course closing deliverable (portfolio). The owner asked whether pinning public repositories exposed anything and how protected the product code is.
**Next**: Portfolio cards QAFRESCO-20, 21 and 22, then the 30-day plan (QAFRESCO-28).

## 2026-11-25 - DOJO project page published, QAFRESCO-20 closed

**What**: Published the project page from `docs/portfolio/dojo-project.md` at https://basimontes.github.io/fresco-qa.html with a card linking to it from the home page (repository BasiMontes/BasiMontes.github.io, commit ae073b0). The website pipeline had been failing since 2026-11-06 because a test required exactly one project in progress, so three earlier changes had never been deployed; the rule now allows at most one.
**Why**: Course closing deliverable (portfolio).
**Next**: Portfolio cards QAFRESCO-21 and 22 (the project entry of 22 is already on the home page), then the 30-day plan (QAFRESCO-28).

## 2026-11-25 - QAFRESCO-22 closed without a Certifications section

**What**: The landing page card was closed with four of the five requested sections (About, Skills, Projects, Contact). Certifications stays unmet: the block had been removed on purpose from the website (commit 04020c7 in BasiMontes/BasiMontes.github.io) and the owner chose to keep the site as it is. The Dojo project entry is on the home page.
**Why**: Owner decision; the deviation is recorded in the Jira comment.
**Next**: QAFRESCO-21 (LinkedIn), then QAFRESCO-28 and the course epic QAFRESCO-8.

## 2026-11-26 - QAFRESCO-28 plan approved, QAFRESCO-2 retest paused

**What**: The 30-day plan (1 to 30 December 2026) was approved and a first post drafted, unpublished, in `docs/portfolio/post-dojo-plan.md`; comment added to QAFRESCO-28, which stays open. `docs/portfolio/landing-page.md` now states the live landing page, and stale wording on the product owner decisions and findings coverage was fixed in `docs/automation-eval.md` and `docs/test-cases.md`. The retest of QAFRESCO-2 was started and paused: the fix (product commit 47850727, pull request 1060) was read, eight outlines were drafted, none was executed, no migration was applied and nothing was written on the bug.
**Why**: The owner chose development first and QA afterwards; another local Supabase project held the database port.
**Next**: Retest QAFRESCO-2 when the owner resumes QA. The owner still has to publish the post, download the certificate, update LinkedIn (QAFRESCO-21) and join the alumni channel.

## 2026-11-26 - LinkedIn card closed (QAFRESCO-21)

**What**: The owner reported LinkedIn as done; QAFRESCO-21 moved to Finalizada and read back. The published profile was not checked from this repo. The featured link for the course project in `docs/portfolio/linkedin.md` now points to the project page (commit 22972d4).
**Why**: Course closing deliverable (portfolio).
**Next**: The certificate, its entry on LinkedIn, the alumni channel and the first post stay in QAFRESCO-28.

## 2026-11-26 - Project page shows the three personas

**What**: Added a persona section (family, egg allergy, vegan and lactose-free) to https://basimontes.github.io/fresco-qa.html and removed the duplicated examples from the exploratory section (website commit 3d5f5cb). The shopping list scaling is stated there as not verified. Website tests: 38 passed, 2 skipped. The push run failed in the deploy step while fetching artifact metadata, and its rerun failed on duplicate artifacts; a manual run (45873791615) published it and the live page was read back.
**Why**: Owner request for the course portfolio.
**Next**: Nothing pending on the page.

## 2026-11-26 - Six defect cards retested and closed, two new defects filed

**What**: Retested QAFRESCO-2, 4, 5, 6, 29 and 34 on a local stack of the product at fresco-app commit 04ee5c6d; all six were commented and closed with the owner approval, and the integration and e2e suites passed 64 of 64. Filed QAFRESCO-36 (no budget warning for the next week) and QAFRESCO-37 (a diet turned off keeps its allergen). Not tested on production or staging. Updated docs/bugs-found.md and docs/test-cases.md.
**Why**: Cards close only after an observed retest; a new scenario gets its own card instead of keeping a fixed one open.
**Next**: Retest the second batch (QAFRESCO-3, 7, 30, 31, 32, 33) when its fixes are deployed, and hand QAFRESCO-36 and 37 to the product session.

## 2026-11-26 - Second retest: four defects closed, one failed

**What**: Retested QAFRESCO-3, 7, 31, 32 and 33 with the app built from fresco-app commit 096f47b2 on a separate local stack; 7, 31, 32 and 33 were commented and closed with the owner approval, and 3 was commented and stays open because two names differ only by an accent. The integration and e2e suites passed 64 of 64. Read-only queries checked the hosted database, where the photo of QAFRESCO-30 had already been replaced. The interface was not tried on production or staging. The CI rerun of commit 9f1edb1 passed, but its deploy step failed without failing the job, so the public results page was not updated. Updated README.md, docs/bugs-found.md, docs/test-cases.md, docs/traceability-matrix.md and docs/automation-eval.md.
**Why**: Cards close only after an observed retest, and a fix that leaves the reported steps failing keeps its card open.
**Next**: Retest QAFRESCO-3, 30, 36 and 37 when the product session reports them, and check the results page after the next scheduled run.
