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

`npm run test` requires local MongoDB. It uses a separate test database.
`npm run lint` and `npm run build` check the frontend.
See ROADMAP.md for the four steps. Step 1 covers setup/accounts; transfer/cancellation workflows follow.
