const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = require("./app");
const connectDB = require("./config/db");

const requiredEnvironmentVariables = ["MONGO_URI", "JWT_SECRET"];
const missingVariables = requiredEnvironmentVariables.filter(
  (variable) => !process.env[variable]
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVariables.join(", ")}. ` +
    "Copy backend/.env.example to backend/.env and update the values."
  );
}

const PORT = Number(process.env.PORT) || 5001;

const startServer = async () => {
  let databaseConnected = false;

  try {
    await connectDB();
    databaseConnected = true;
  } catch (error) {
    console.warn(
      "MongoDB is unavailable. The API will start in degraded mode:",
      error.message
    );
  }

  app.set("databaseConnected", databaseConnected);

  const server = app.listen(PORT, () => {
    const databaseState = databaseConnected ? "connected" : "degraded";
    console.log(`Transfera API running on http://localhost:${PORT} (${databaseState})`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Closing server...`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error("Unable to start Transfera API:", error.message);
  process.exit(1);
});