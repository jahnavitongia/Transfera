# Run Transfera on Windows

Using a Mac? Follow [the Mac setup guide](TEAMMATE_SETUP_MAC.md).

Use Windows 10/11 x64, about 3 GB free on your chosen drive, and internet for the first setup. No Git, Node, MongoDB, IDE or cloud account needs to be installed beforehand.

1. Open https://github.com/jahnavitongia/Transfera. Select **main → Code → Download ZIP**. Choose any folder on your laptop. Save the ZIP there and extract it.
2. Open the extracted **Transfera-main** folder. You must see `README.md`, `backend`, `frontend` and `scripts`.
3. Click File Explorer's address bar, type `powershell`, and press Enter. Paste this command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Setup-Windows.ps1
```

Wait for **SETUP COMPLETE**. First setup downloads portable tools, including about 800 MB for MongoDB. Downloads, data and logs stay inside your chosen project folder.

4. In the same PowerShell window, paste:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Start-Demo.ps1
```

Wait for **Demo started**. Open http://localhost:5173 in your browser.

5. Check that everything works:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Check-Demo.ps1
```

Expect **SETUP CHECK PASSED**. This checks MongoDB, the API, the frontend and four logins.

## Sign in

Password for all: **TransferaDemo123!**

- Transfer: `transfer@transfera.demo`
- Cancellation: `cancellation@transfera.demo`
- Review: `staff@transfera.demo`
- Final decisions: `admin@transfera.demo`

If login says **Invalid email or password**, use the exact demo email and password above. A personal account must be registered on this laptop; accounts created on another laptop are not shared. Run the setup check to confirm the demo accounts exist and their logins work.

Each teammate has their own local database. Your actions do not appear on another laptop.

## Next time

Run only the Start command. To stop, paste:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Stop-Demo.ps1
```

If setup/start/check fails, copy the error text to the team. Never send `.env` or tokens. For “Unable to connect”, run Check-Demo and open http://localhost:5001/api/health. An existing service on ports 27018, 5001 or 5173 must be stopped before starting this demo.
