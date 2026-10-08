# Transfera

A working local demo for student transfers and admission cancellation. Students submit requests, staff reviews academic evidence, and an admin records the final decision.

**Stack:** React/Vite, Express/Node, MongoDB/Mongoose, JWT and bcrypt. All demo records are fictional. AI is future scope; ABC ID is excluded.

## Windows setup

Download `main` and extract it inside `D:\Chatgpt_env\Transfera`. Open PowerShell in the folder containing this README, then run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Setup-Windows.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Start-Demo.ps1
```

Setup downloads verified portable Node 22.23.3 and MongoDB 8.0.20 with app-local Microsoft runtime libraries when missing, installs dependencies and creates local configuration. Internet is needed initially; the MongoDB archive is about 800 MB. Project downloads, caches, data and logs stay on D:. Existing configuration and request history are preserved.

Open http://localhost:5173. To check setup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Check-Demo.ps1
```

## Presentation accounts

All use password `TransferaDemo123!` for this local fictional demo.

| Purpose | Email |
| --- | --- |
| Transfer student | transfer@transfera.demo |
| Cancellation student | cancellation@transfera.demo |
| Staff review | staff@transfera.demo |
| Admin decisions | admin@transfera.demo |

Sample transfer: BCA → BCA or BSc Computer Science, semester 3. Staff can accept 8 credits from the sample subjects; two requirements in the compared semesters remain. Academic rules are editable samples, and duplicate flags require manual checks.

## Guides

- [Short teammate setup](TEAMMATE_SETUP.md)
- [Project guide for team and jury](docs/PROJECT_GUIDE.md) · [Printable PDF](docs/Transfera_Project_Guide.pdf)
- [Maintainer handoff](HANDOFF.md)
- [Manual demo checks](DEMO_TESTING.md)

Stop the demo with `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Stop-Demo.ps1`.

With Node on PATH: `npm run test`, `npm run lint`, `npm run build`. API tests use separate local MongoDB databases. Do not commit `.env`, runtime tools or database folders.
