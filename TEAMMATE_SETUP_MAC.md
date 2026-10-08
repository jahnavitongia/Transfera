# Run Transfera on a Mac

Use **macOS 14 or later**, an Intel or Apple Silicon Mac, about **3 GB free**, and internet for the first setup. No Homebrew, Git, Node or MongoDB installation is needed. Tools, caches and data stay in your project folder.

1. Open https://github.com/jahnavitongia/Transfera. Select **main → Code → Download ZIP**. Extract the ZIP anywhere. Open **Transfera-main**; it must contain `README.md`, `backend`, `frontend` and `scripts`.
2. Open **Terminal** using Spotlight (Command + Space). Type `cd ` with a space, drag the **Transfera-main folder** into Terminal, then press Enter. This opens Terminal in the project folder.
3. Paste:

```bash
bash scripts/Setup-Mac.sh
```

Wait for **SETUP COMPLETE**. First setup downloads Node, MongoDB and app dependencies. The processor type is detected automatically.

4. In this Terminal, paste:

```bash
bash scripts/Run-Mac.sh database
```

Keep it open. Wait a few seconds. If it exits with an error, stop and share the error with the team.

5. Open a **second Terminal window** (Command + N). Repeat step 2 to enter the project folder, then paste:

```bash
bash scripts/Run-Mac.sh backend
```

Wait for the API to start. This also prepares the sample accounts.

6. Open a **third Terminal window**, repeat step 2, then paste:

```bash
bash scripts/Run-Mac.sh frontend
```

Open **http://localhost:5173**. Keep all three Terminal windows open.

7. To check everything, open a fourth Terminal, repeat step 2, and paste:

```bash
bash scripts/Run-Mac.sh check
```

Expect **SETUP CHECK PASSED**: database, backend, frontend and four logins work.

## Sign in

Password for all: **TransferaDemo123!**

- Transfer: `transfer@transfera.demo`
- Cancellation: `cancellation@transfera.demo`
- Review: `staff@transfera.demo`
- Final decisions: `admin@transfera.demo`

If login says **Invalid email or password**, use the exact demo email and password above. A personal account must be registered on this laptop; accounts created on another laptop are not shared. Run the setup check to confirm the demo accounts exist and their logins work.

Each teammate has a separate local database. Next time, repeat only steps 4–6. To stop, press **Control + C** in the frontend, backend, then database Terminal.

If “Unable to connect” appears, check all three Terminals and run step 7. If macOS blocks a downloaded tool, follow Apple's [Open a Mac app from an unknown developer](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unknown-developer-mh40616/mac) instructions for the official Node/MongoDB executable; do not disable Gatekeeper. Send error text to the team, never `.env` or tokens.

Requirement reference: [MongoDB macOS support](https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-os-x/). This guide still needs a real Mac trial; it was prepared from Windows.
