const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");
for (const variable of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[variable]) throw new Error(`${variable} is required. Configure backend/.env first.`);
}
const start = async () => {
  await connectDB();
  const port = Number(process.env.PORT) || 5001;
  const server = app.listen(port, "127.0.0.1", () => console.log(`Transfera API: http://127.0.0.1:${port}`));
  const shutdown = () => server.close(async () => { await mongoose.disconnect(); process.exit(0); });
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};
start().catch(error => { console.error(error.message); process.exit(1); });
