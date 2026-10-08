# Transfera handoff — step 1

Branch: demo/minimal-workflow. Fixed stack: React/Vite, Express, MongoDB/Mongoose.
AI is future scope; ABC IDs are excluded. Demo records are fictional.

## Ready
- Local MongoDB + API + frontend; see README.md for launch commands.
- Student registration/login; pre-created student, staff and admin accounts.
- Admin-only staff creation; server-enforced role permissions.
- Account-aware navigation, session restoration and logout.
- Sample student and BCA/BSc Computer Science catalog.

Accounts: student@transfera.demo, staff@transfera.demo, admin@transfera.demo.
Demo password: TransferaDemo123!

Checks passed: 5 database-backed API tests, frontend lint/build, backend syntax,
and browser login/navigation/logout checks for all three roles.
Test database is separate from the demo database. Runtime data and .env are ignored.

## Next
Step 2: student profile and transfer submission (same degree + program switch),
scoped subject comparison, staff review, recorded final decision and student status.
Step 3: cancellation request/review/decision. Step 4: short demo and report.
Existing evaluation logic is still unreliable: do not present it as finished.
Student home currently shows account details; request forms are not built yet.

Swaraj wants a short checkpoint after each step before moving on.
Sample academic rules must be labelled and configurable for faculty review.
