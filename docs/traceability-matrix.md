# Traceability matrix: Allergy-safe weekly menu

Maps every acceptance criterion to its test cases, to the automated checks (ATCs) that run them, and to the defects they surfaced. Sources: criteria in `docs/feature-test-plan.md` section 4, cases in `docs/test-cases.md`, ATCs in `kata-manifest.json` and `tests/`, defects in `docs/bugs-found.md`, coverage detail in `docs/automation-eval.md`.

Legend. Coverage: Automated means at least one ATC runs the criterion in CI; Manual means designed or executed by hand only; Gap means no test case or no executed check backs it.

## 1. Criterion to test case to automated check

| AC | Criterion (short) | Test cases | API ATC | UI ATC | Defects found | Coverage |
|---|---|---|---|---|---|---|
| AC-1 | No declared allergen in the 21 recipes | TC-01, TC-02, TC-04, TC-05, TC-06, TC-16, TC-18 | `TC-01`, `TC-02`, `TC-04`, `CHK-B2-1` | `UI-TC-01` | BUG-01 (TC-16), BUG-03 (TC-18) | Automated; TC-05, TC-06 and TC-18 are not |
| AC-2 | Every recipe satisfies all active diets | TC-03 | `TC-03`, `CHK-B2-2` | `UI-TC-03` | none | Automated; shopping list content not checked |
| AC-3 | One slot per day and meal, no repeated comida or cena | TC-06, TC-11 | none | `UI-TC-11` | BUG-04 (TC-11) | Automated for a future week; mid-week menus not tested |
| AC-4 | Swapping a slot changes only that slot and stays safe | TC-09 | none | none | none | Gap: designed, never executed or automated |
| AC-5 | Shopping list grouped by aisle, quantities scale with N | TC-07 | none | none | none | Gap: designed, never executed or automated |
| AC-6 | Household limits: people 1 to 10, adults, children | TC-08 | `TC-08-1`, `TC-08-2` | none | none | Automated; row 4 people, 1 adult, 0 children excluded until the PO answers |
| AC-7 | Allergen added after generation: pending slots replaced or user warned | TC-10 | none | none | none | Gap: manual, expected behaviour needs PO confirmation |
| AC-8 | Consent, export and deletion of health data | TC-12, TC-16 | none | none | BUG-01 (TC-16) | Gap for deletion: TC-12 never executed; TC-16 executed once by hand |
| AC-9 | Free text flagged as not used for filtering | TC-13 | none | none | none | Gap: manual only |
| AC-10 | Diet and allergy filters available on the Free plan | TC-14 | none | `UI-TC-14` | none | Automated |
| AC-11 | Over-budget menu shows a warning | TC-17 | none | none | BUG-02 (TC-17) | Gap: executed once by hand, found a defect, no automated check |
| Security | A user cannot read another user's data | TC-15 | `TC-15`, `CHK-A1`, `CHK-A2`, `CHK-A5`, `CHK-U1-1`, `CHK-U1-2`, `CHK-U1-3`, `CHK-C1-1`, `CHK-C1-2` | none | none | Automated |

## 2. Test case to criterion to automated check

| TC | AC | Priority | API ATC | UI ATC | Status |
|---|---|---|---|---|---|
| TC-01 | AC-1 | P1 | `TC-01` | `UI-TC-01` | Automated, both levels |
| TC-02 | AC-1 | P1 | `TC-02` | none | Automated, 2 weeks per run |
| TC-03 | AC-2 | P1 | `TC-03` | `UI-TC-03` | Automated, both levels |
| TC-04 | AC-1 | P1 | `TC-04` | none | Automated |
| TC-05 | AC-1 | P3 | none | none | Not automated |
| TC-06 | AC-1, AC-3 | P2 | none | none | Manual by design |
| TC-07 | AC-5 | P2 | none | none | Not automated |
| TC-08 | AC-6 | P2 | `TC-08-1`, `TC-08-2` | none | Automated |
| TC-09 | AC-4 | P1 | none | none | Not automated |
| TC-10 | AC-7 | P1 | none | none | Manual by design |
| TC-11 | AC-3 | P2 | none | `UI-TC-11` | Automated |
| TC-12 | AC-8 | P2 | none | none | Not automated |
| TC-13 | AC-9 | P2 | none | none | Manual by design |
| TC-14 | AC-10 | P2 | none | `UI-TC-14` | Automated |
| TC-15 | Security | P1 | `TC-15` | none | Automated |
| TC-16 | AC-1, AC-8 | P2 | none | none | Executed once by hand |
| TC-17 | AC-11 | P2 | none | none | Executed once by hand |
| TC-18 | AC-1 | P3 | none | none | Manual by design |

## 3. Checks without a test case

14 ATCs use the prefix `CHK-` because they come from the API session report, not from a test case. They back the Security row and the AC-1 and AC-2 filter checks above. `CHK-D1`, `CHK-D2`, `CHK-D3` (menu generation input validation and duplicate week) and `CHK-U4` (catalogue read without a session) map to no acceptance criterion; they are extra checks, not coverage of a criterion.

## 4. Gaps

| Gap | Criterion | Reason |
|---|---|---|
| No test case executed or automated | AC-4, AC-5 | Designed only; P1 for AC-4 |
| No automated check | AC-7, AC-8, AC-9, AC-11 | AC-7 and AC-9 are manual by design; AC-8 needs a spare account; AC-11 is a candidate defect awaiting the PO |
| Test cases designed but neither executed by hand nor automated | TC-05, TC-06, TC-07, TC-09, TC-10, TC-12, TC-13 | Status Designed in `docs/test-cases.md` with no ATC |
| Open criteria needing the PO | AC-3, AC-6, AC-7 | Marked NEEDS PO CONFIRMATION in `docs/feature-test-plan.md` |

## 5. Totals

| Measure | Value |
|---|---|
| Criteria (AC-1 to AC-11 plus Security) | 12 |
| Criteria with at least one automated check | 6 (AC-1, AC-2, AC-3, AC-6, AC-10, Security) |
| Criteria with no automated check | 6 (AC-4, AC-5, AC-7, AC-8, AC-9, AC-11) |
| Criteria with no test case | 0 |
| Test cases | 18 |
| Test cases with an automated check | 8 (TC-01, 02, 03, 04, 08, 11, 14, 15) |
| Defects linked to a test case | 4 of 9 (BUG-01, 02, 03, 04) |
