# Transfera maintainer handoff

Use `main`. The presentation prototype includes both transfer and cancellation workflows; development work from the former demo branch is included here.

Start with TEAMMATE_SETUP.md. It does not require preinstalled Node/MongoDB. README.md lists accounts. Read docs/PROJECT_GUIDE.md for scope and limits, and DEMO_TESTING.md for the rehearsal.

## Important files

- `backend/scripts/seed.js`: fictional accounts, profiles and sample curricula; repeated seeding preserves requests.
- `backend/config/computingPilot.json`: School of Computing pilot policy, catalogue, students and expected evidence.
- `backend/config/demoPolicy.js`: sample eligibility rules and credit cap for the earlier BCA cases.
- `backend/services/courseComparison.js` and `comparison/worker.mjs`: offline MiniLM outcome ranking with the title fallback.
- `backend/services/transferMapping.js`: title aliases, similarity suggestions and duplicate flags.
- `backend/scripts/reset-demo.js`: scoped reset of the four presentation students, with a request backup.
- `backend/controllers/transferController.js`: submission, comparison, review and decisions.
- `backend/controllers/cancellationController.js`: cancellation lifecycle.
- `backend/services/studentStatus.js`: admission status derived from request decisions.
- `backend/services/admissionWorkflow.js`: shared reservation preventing simultaneous workflows.
- `backend/middleware/authMiddleware.js`: session and role enforcement.
- `frontend/src/pages`: student, staff and admin screens.
- `scripts`: Windows and Mac setup/start/stop/check/reset and configuration creation.

## Verify and continue

API tests require MongoDB on 27018. Run `npm run test`, `npm run lint` and `npm run build` with Node on PATH. Windows Check-Demo verifies service readiness and seeded account logins. Each machine keeps its own database.

Keep the current stack. Use fictional data for presentation. Do not claim title or model similarity proves equivalence or fraud. The model only ranks evidence; faculty and the admin decide. Accuracy on real records, OCR, authoritative verification, real curricula, refunds and production deployment remain future work.

Before institution use, implement recovery for interrupted shared reservations, secure document handling, approved academic policies, backups and broader testing. Older mapping/previous-subject APIs remain in the repository; the current transfer document is the authoritative workflow record.

Never commit `.env`, `.demo`, databases or portable binaries. For another rehearsal after a final decision, use the scoped reset in DEMO_TESTING.md, which touches only the four presentation students, or register a new fictional student. Do not delete other history or overwrite other people's records.
