# Manual presentation checks

Use the four presentation accounts from README.md. All passwords are `TransferaDemo123!`. Start the demo and run Check-Demo first. Initial profiles are already complete.

## Transfer

1. Sign in as `transfer@transfera.demo`. Open **Your profile** and confirm Aarav Sharma, Sample College A and BCA.
2. Open **Your transfers → New transfer**. Select BCA for the first demonstration. Click **Use sample subjects and transcript → Submit transfer request**.
3. Open the transcript. Confirm the fictional label. Credits are not yet approved. Note the possible duplicate flag.
4. Sign out. Sign in as staff. Open **Transfers → Open request → Compare subjects**.
5. Confirm Programming Fundamentals and Data Structures are eligible. Mathematics fails at 3/10. DBMS has only 2 completed credits against 4 required.
6. Leave the two eligible subjects selected. Enter notes describing fictional syllabus/record checks, tick the duplicate review checkbox, and save. Expect **8 reviewed credits**; approval has not occurred yet.
7. Sign in as admin, open the same request, give a decision reason and approve. Expect **8 credits approved**, with two compared requirements still remaining.
8. Sign in again as the transfer student and refresh. The final decision must remain visible.

## Cancellation

9. Sign in as `cancellation@transfera.demo`. Open **Your cancellations → Request cancellation**. Confirm Riya Patel and the Sample College A admission.
10. Use the sample reason, acknowledge the effect, and submit. Admission must remain active while pending. New transfer submission must be blocked.
11. Sign in as staff. Open **Cancellations → Open request**. Recommend approval, add notes and save.
12. Sign in as admin. Record approval with a reason. Sign in as Riya again: the dashboard must show **cancelled**, and the detail must show the decision date and reason.

## Additional checks

- Staff must not see an admin final-decision button.
- A student must not see another student's records.
- To demonstrate rejection or BCA → BSc, register a new fictional student and repeat the relevant journey. Rejection preserves admission status. Program switching still awards the sample's two eligible subjects, while unmatched destination subjects remain.
- Seed runs do not reset decisions. Keep screenshots before rehearsing if you need a fallback.

Record the step number and error text for anything that fails. Do not change academic rules during the presentation.
