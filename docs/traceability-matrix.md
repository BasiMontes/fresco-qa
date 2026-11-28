# Traceability matrix: Allergy-safe weekly menu

Maps every acceptance criterion to its test cases, to the automated checks (ATCs) that run them, and to the defects they surfaced. Sources: criteria in `docs/feature-test-plan.md` section 4, cases in `docs/test-cases.md`, ATCs in `kata-manifest.json` and `tests/`, defects in `docs/bugs-found.md`, coverage detail in `docs/automation-eval.md`.

Legend. Coverage: Automated means at least one ATC runs the criterion in CI; Manual means designed or executed by hand only; Gap means no test case or no executed check backs it.

## 1. Criterion to test case to automated check

| AC | Criterion (short) | Test cases | API ATC | UI ATC | Defects found | Coverage |
|---|---|---|---|---|---|---|
| AC-1 | No declared allergen in the 21 recipes | TC-01, TC-02, TC-04, TC-05, TC-06, TC-16, TC-18 | `TC-01`, `TC-02`, `TC-04`, `CHK-B2-1` | `UI-TC-01`, `UI-TC-05`, `UI-TC-16-1`, `UI-TC-16-2`, `UI-TC-16-3`, `UI-TC-16-4` | BUG-01 (TC-16, fixed), BUG-03 (TC-18, fixed), BUG-10 (TC-05, closed), BUG-14 (TC-16, closed) | Automated; TC-06 and TC-18 are not |
| AC-2 | Every recipe satisfies all active diets | TC-03 | `TC-03`, `CHK-B2-2` | `UI-TC-03` | none | Automated; shopping list content not checked |
| AC-3 | One slot per day and meal, no repeated comida or cena | TC-06, TC-11 | none | `UI-TC-11` | none (BUG-04 was by design) | Automated for a future week; the PO confirmed that a mid-week menu leaves the past days empty |
| AC-4 | Swapping a slot changes only that slot and stays safe | TC-09 | none | `UI-TC-09` | BUG-11 (FAQ promise, closed) | Automated: AC-4 is the "Añadir al menú" flow (PO decision) |
| AC-5 | Shopping list grouped by aisle, quantities scale with N | TC-07 | none | `UI-TC-07-1` | none | Automated for 1, 4 and 10 people on the current week; children count as adults (improvement QAFRESCO-35) |
| AC-6 | Household limits: people 1 to 10, adults, children | TC-08 | `TC-08-1`, `TC-08-2` | none | BUG-12 (total above 10 in the onboarding, fixed) | Automated; row 4 people, 1 adult, 0 children not tested: the database accepts it and the app cannot produce it |
| AC-7 | Allergen added after generation: pending slots emptied and the user warned | TC-10 | `TC-10` | none | none | Automated; behaviour confirmed by the PO |
| AC-8 | Consent, export and deletion of health data | TC-12, TC-16 | none | `UI-TC-12-1`, `UI-TC-12-2`, `UI-TC-12-3`, `UI-TC-16-1`, `UI-TC-16-2`, `UI-TC-16-3`, `UI-TC-16-4` | BUG-01 (TC-16, fixed), BUG-14 (TC-16, closed) | Partly automated: consent gate, stored allergens and deletion. Export is not covered |
| AC-9 | Free text flagged as not used for filtering | TC-13 | none | none | none | Gap: manual only |
| AC-10 | Diet and allergy filters available on the Free plan | TC-14 | none | `UI-TC-14` | none | Automated |
| AC-11 | Over-budget menu shows a warning | TC-17 | none | `UI-TC-17-1`, `UI-TC-17-2`, `UI-TC-17-3` | BUG-02 (TC-17, fixed), BUG-13 (TC-17, fixed) | Automated for the current and next week; a past week is not covered |
| Security | A user cannot read another user's data | TC-15 | `TC-15`, `CHK-A1`, `CHK-A2`, `CHK-A5`, `CHK-U1-1`, `CHK-U1-2`, `CHK-U1-3`, `CHK-C1-1`, `CHK-C1-2` | none | none | Automated |

## 2. Test case to criterion to automated check

| TC | AC | Priority | API ATC | UI ATC | Status |
|---|---|---|---|---|---|
| TC-01 | AC-1 | P1 | `TC-01` | `UI-TC-01` | Automated, both levels |
| TC-02 | AC-1 | P1 | `TC-02` | none | Automated, 2 weeks per run |
| TC-03 | AC-2 | P1 | `TC-03` | `UI-TC-03` | Automated, both levels |
| TC-04 | AC-1 | P1 | `TC-04` | none | Automated |
| TC-05 | AC-1 | P3 | none | `UI-TC-05` | Automated |
| TC-06 | AC-1, AC-3 | P2 | none | none | Manual by design |
| TC-07 | AC-5 | P2 | none | `UI-TC-07-1` | Automated |
| TC-08 | AC-6 | P2 | `TC-08-1`, `TC-08-2` | none | Automated |
| TC-09 | AC-4 | P1 | none | `UI-TC-09` | Automated, add-to-menu flow |
| TC-10 | AC-7 | P1 | `TC-10` | none | Automated |
| TC-11 | AC-3 | P2 | none | `UI-TC-11` | Automated |
| TC-12 | AC-8 | P2 | none | `UI-TC-12-1`, `UI-TC-12-2`, `UI-TC-12-3` | Automated |
| TC-13 | AC-9 | P2 | none | none | Manual by design |
| TC-14 | AC-10 | P2 | none | `UI-TC-14` | Automated |
| TC-15 | Security | P1 | `TC-15` | none | Automated |
| TC-16 | AC-1, AC-8 | P2 | none | `UI-TC-16-1`, `UI-TC-16-2`, `UI-TC-16-3`, `UI-TC-16-4` | Automated |
| TC-17 | AC-11 | P2 | none | `UI-TC-17-1`, `UI-TC-17-2`, `UI-TC-17-3` | Automated |
| TC-18 | AC-1 | P3 | none | none | Manual by design |

## 3. Checks without a test case

25 ATCs use the prefix `CHK-` because they come from the API session report or from the response-schema and CRUD assessment, not from a test case. They back the Security row and the AC-1 and AC-2 filter checks above. `CHK-D1`, `CHK-D2`, `CHK-D3` (menu generation input validation and duplicate week) `CHK-U4` (catalogue read without a session), `CHK-S1` and `CHK-S2` (response schemas) and `CHK-E1` to `CHK-E9` (catalogue edge cases, invalid profile writes, menu deletion and denied direct insert) map to no acceptance criterion; they are extra checks, not coverage of a criterion.

## 4. Gaps

| Gap | Criterion | Reason |
|---|---|---|
| No automated check | AC-9 | Manual by design |
| Export not covered | AC-8 | No test case asks for the data export |
| Test cases designed but neither executed by hand nor automated | TC-06, TC-13 | Status Designed in `docs/test-cases.md` with no ATC |
| Open criteria needing the PO | none | AC-6 was defined with the PO's acceptance of QA's recommendation |

## 5. Totals

| Measure | Value |
|---|---|
| Criteria (AC-1 to AC-11 plus Security) | 12 |
| Criteria with at least one automated check | 11 (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-10, AC-11, Security) |
| Criteria with no automated check | 1 (AC-9) |
| Criteria with no test case | 0 |
| Test cases | 18 |
| Test cases with an automated check | 15 (TC-01, 02, 03, 04, 05, 07, 08, 09, 10, 11, 12, 14, 15, 16, 17) |
| Defects linked to a test case | 8 of 13 (BUG-01, 02, 03, 10, 11, 12, 13, 14); BUG-04 is not a defect |
