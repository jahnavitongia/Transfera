const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
for (const folder of ["database", "tmp"]) fs.mkdirSync(path.join(root, ".demo", folder), { recursive: true });
const envFile = path.join(root, "backend", ".env");
if (!fs.existsSync(envFile)) {
  const example = fs.readFileSync(path.join(root, "backend", ".env.example"), "utf8");
  fs.writeFileSync(envFile, example.replace("replace-with-a-long-random-secret", crypto.randomBytes(48).toString("hex")), { flag: "wx", mode: 0o600 });
  console.log("Created local backend configuration with a random secret.");
} else console.log("Existing backend configuration preserved.");
console.log("Demo data folders ready. Next: start the demo.");
