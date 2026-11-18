# Manual presentation checks

Use the presentation accounts from README.md. All passwords are `TransferaDemo123!`. Start the demo and run Check-Demo first. Initial profiles are already complete.

## School of Computing pilot (presentation journey)

1. Sign in as `soc.transfer@transfera.demo` (Neha Kulkarni). Choose **New transfer**, check the profile and select **Continue to academic evidence**.
2. Select **Use sample subjects and transcript**, then **Review request** and **Submit transfer request**. A submission receipt appears with **Print receipt**.
3. Sign in as staff. Open the request from **Faculty review** and choose **Compare subjects**. Accept Programming Fundamentals and Data Structures Lab. Engineering Mathematics I is blocked at 3/10 and the database course has 2 of 4 credits. Add notes and **Save academic review**.
4. Sign in as admin. Open the request from **Academic decisions**, give a reason and **Record final decision**. Expect **6 credits approved**. The student sees the decision and can **Print decision**.
5. Sign in as `soc.cancel@transfera.demo` (Ishan Deshmukh). Choose **Request cancellation → Use sample reason**, tick the acknowledgement and submit.
6. Staff opens the cancellation, adds notes and saves the review. Admin records the decision. Ishan's decision says the admission is cancelled and refers fee clearance to Accounts.

## Earlier BCA journey: transfer

1. Sign in as `transfer@transfera.demo`. Open **Your profile** and confirm Aarav Sharma, Sample College A and BCA.
2. Open **Your transfers → New transfer**. Select BCA for the first demonstration. Click **Use sample subjects and transcript → Submit transfer request**.
3. Open the transcript. Confirm the fictional label. Credits are not yet approved. Note the possible duplicate flag.
4. Sign out. Sign in as staff. Open **Transfers → Open request → Compare subjects**.
5. Confirm Programming Fundamentals and Data Structures are eligible. Mathematics fails at 3/10. DBMS has only 2 completed credits against 4 required.
6. Leave the two eligible subjects selected. Enter notes describing fictional syllabus/record checks, tick the duplicate review checkbox, and save. Expect **8 reviewed credits**; approval has not occurred yet.
7. Sign in as admin, open the same request, give a decision reason and approve. Expect **8 credits approved**, with two compared requirements still remaining.
8. Sign in again as the transfer student and refresh. The final decision must remain visible.

## Earlier BCA journey: cancellation

9. Sign in as `cancellation@transfera.demo`. Open **Your cancellations → Request cancellation**. Confirm Riya Patel and the Sample College A admission.
10. Use the sample reason, acknowledge the effect, and submit. Admission must remain active while pending. New transfer submission must be blocked.
11. Sign in as staff. Open **Cancellations → Open request**. Recommend approval, add notes and save.
12. Sign in as admin. Record approval with a reason. Sign in as Riya again: the dashboard must show **cancelled**, and the detail must show the decision date and reason.

## Additional checks

- Staff must not see an admin final-decision button.
- A student must not see another student's records.
- To demonstrate rejection or BCA → BSc, register a new fictional student and repeat the relevant journey. Rejection preserves admission status. Program switching still awards the sample's two eligible subjects, while unmatched destination subjects remain.
- Seed runs do not reset decisions. Use the reset below to repeat a journey, and keep screenshots as a fallback.

Record the step number and error text for anything that fails. Do not change academic rules during the presentation.

## Record the demo again

Keep the demo running and stop making requests while resetting. This deletes transfer/cancellation requests only for `soc.transfer@transfera.demo`, `soc.cancel@transfera.demo`, `transfer@transfera.demo` and `cancellation@transfera.demo`, and restores their active admission status. It keeps accounts and curricula, and puts the two Computing pilot profiles back to their sample values. A request backup is saved under `.demo/reset-backups`.

From the project folder on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Reset-Demo.ps1
```

On a Mac:

```bash
bash scripts/Run-Mac.sh reset
```

Expect **DEMO RESET COMPLETE**. Sign out, sign back in, and repeat the walkthrough. To see request counts without changing data, add `-Preview` on Windows or use `bash scripts/Run-Mac.sh reset-preview` on a Mac.
