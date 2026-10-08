const path = require("node:path");
const fs = require("node:fs");
const root = path.resolve(__dirname, "..");
let mongoose;
const check = (ok, message) => { if (!ok) throw new Error(message); console.log("OK: " + message); };
(async () => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  check(major > 22 || (major === 22 && minor >= 12), "Node 22.12 or later");
  let dotenv;
  try {
    mongoose = require(path.join(root, "backend/node_modules/mongoose"));
    dotenv = require(path.join(root, "backend/node_modules/dotenv"));
    if (!fs.existsSync(path.join(root, "frontend/node_modules/vite/bin/vite.js"))) throw new Error("Vite is missing");
  } catch { throw new Error("Dependencies are missing. Run Setup-Windows.ps1 or npm run setup."); }
  check(fs.existsSync(path.join(root, "backend/.env")), "backend/.env exists; otherwise run npm run init:demo");
  dotenv.config({ path: path.join(root, "backend/.env"), quiet: true });
  check(Boolean(process.env.MONGO_URI && process.env.JWT_SECRET && process.env.JWT_SECRET !== "replace-with-a-long-random-secret"), "Database URL and a non-placeholder secret are configured");
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.db.admin().ping();
  console.log("OK: MongoDB is reachable");
  const User = require(path.join(root, "backend/models/user"));
  const accounts = await User.countDocuments({ email: { $in: ["transfer@transfera.demo", "cancellation@transfera.demo", "staff@transfera.demo", "admin@transfera.demo"] } });
  check(accounts === 4, "Four presentation accounts exist; otherwise run npm run seed");
  const port = Number(process.env.PORT) || 5001;
  const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(5000) });
  const health = await response.json();
  check(response.ok && health.database === "connected", "Backend health confirms its database connection");
  for (const [email, role] of [["transfer@transfera.demo", "student"], ["cancellation@transfera.demo", "student"], ["staff@transfera.demo", "staff"], ["admin@transfera.demo", "admin"]]) {
    const result = await fetch(`http://127.0.0.1:${port}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "TransferaDemo123!" }), signal: AbortSignal.timeout(5000) });
    const data = await result.json();
    check(result.ok && data.user?.role === role && Boolean(data.token), `${role} login works for ${email}`);
  }
  const frontend = await fetch(process.env.CLIENT_URL || "http://localhost:5173", { signal: AbortSignal.timeout(5000) });
  check(frontend.ok && (await frontend.text()).includes('id="root"'), "Frontend is reachable");
  console.log("SETUP CHECK PASSED. Open http://localhost:5173 and run the manual walkthrough.");
})().catch(error => { console.error("SETUP CHECK FAILED: " + error.message); console.error("Keep the error text and share it with the team; do not send .env or secrets."); process.exitCode = 1; })
  .finally(async () => { if (mongoose) await mongoose.disconnect(); });
