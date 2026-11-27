# Spec: TC-12, deleting the account removes the health data

Source: TC-12 in `docs/test-cases.md`, AC-8 in `docs/feature-test-plan.md`. No defect linked.

No signed ROI verdict exists; that gate was waived for this project (`docs/automation-eval.md` section 8).

## Scenarios

| ATC | Precondition | Action | Expected |
|---|---|---|---|
| `UI-TC-12-1` | Registered account with a declared allergy, a menu and consents | Delete the account, confirming with email and password | The app returns to the sign-in screen, the account cannot sign in, no profile, menu or consent row remains, and one erasure record exists under the hash of the user id |
| `UI-TC-12-2` | Guest account with a declared allergy, a menu and consents | Delete the account, confirming with the fixed phrase | Same, except the sign-in check, which a guest does not have |
| `UI-TC-12-3` | Registered account with data | Try to delete it with a wrong password | An error is shown, the data is unchanged and no erasure record exists |

## Oracle

- Owner decision of 2026-11-27 on the erasure record: the user id may be stored in clear only while the deletion in the analytics service is pending, so the record can be retried. The pending id is the user id when that deletion is pending, and empty otherwise.
- Before each deletion the test reads the rows it later expects to be gone. A missing row at that point fails the test.

## Limits

- `UI-TC-12-3` shows that the screen does not call the deletion with a wrong password. The check the server makes on its own is not exercised.
- A test case result reflects the screen steps only; the data checks are in the test, so only the test status counts.
- The generated passwords appear in the local report and in the CI artifact. The accounts are throwaway and local.

## Out of scope

Data export, accounts with a subscription, recipes and favourites created by the person, the analytics service itself, the retry job.
