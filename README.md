# Transfera

Student transfer and admission cancellation demo. React/Vite + Express + MongoDB.
AI is future scope; ABC IDs are excluded. All seeded records are fictional.

## Run

Requires Node 22.12+ and MongoDB Community running locally.

1. `npm run setup`
2. Copy `backend/.env.example` to `backend/.env`; set a random JWT_SECRET.
3. Start MongoDB on port 27018 with an explicit local data/log folder.
4. `npm run seed` (adds missing sample records; does not clear existing data).
5. In two terminals: `npm run backend` and `npm run frontend`.
6. Open http://localhost:5173.

On Swaraj's prepared D: workspace, run `powershell -ExecutionPolicy Bypass -File scripts/Start-Demo.ps1`.
That launcher starts only the local database/API/frontend, with data/logs under Transfera.

## Demo accounts

Password for all seeded accounts: `TransferaDemo123!` (fictional local demo only).

| Account | Email |
| --- | --- |
| Admin | admin@transfera.demo |
| Staff | staff@transfera.demo |
| Student | student@transfera.demo |

Students register publicly. Only admins create staff. The API enforces permissions.
No password or JWT secret is included in API account responses or committed environment files.

## Check and continue

`npm run test` requires local MongoDB. It uses separate test databases.
`npm run lint` and `npm run build` check the frontend.
Steps 1–3 are complete: accounts, student profile/transcript submission, BCA-to-BCA or BCA-to-BSc comparison, staff review and admin-only decisions. Admission cancellation includes student requests, staff recommendations, admin decisions and consistent admission status.

For a short demo: student signs in → Profile → Use sample profile → Save → Continue → Use sample subjects and transcript → Submit. Staff opens Transfers → Compare subjects → checks course content and record flags → saves review. Admin records the final decision; student sees approved credits and remaining subjects.

For cancellation: student opens Your cancellations → Request cancellation → enters a reason and acknowledges the effect. Staff saves a recommendation; admin approves or rejects with a reason. Approval cancels that admission; rejection keeps it unchanged. A student cannot run a transfer and cancellation together. Requests and decision dates remain as history. Fee refunds and institutional clearance are outside this demo.

Rules live in `backend/config/demoPolicy.js`: semester 3 entry, 4/10 minimum grade, sufficient completed credits, 80% suggested / 50% review name similarity, and a 60-credit cap for the fictional 120-credit degree. Course aliases also suggest matches; staff verifies syllabus content. These are editable sample rules, not institution approval or proof of identity. The 50% cap and academic review approach were informed by the historical [MIT ADT 2016 academic ordinances](https://mituniversity.ac.in/assets_web/pdf/about/Academic_Ordinances_2016.pdf); other demo choices require faculty confirmation.

See ROADMAP.md for the remaining steps.
