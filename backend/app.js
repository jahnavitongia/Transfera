const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const studentRoutes = require("./routes/studentRoutes");
const transferRoutes = require("./routes/transferRoutes");
const mappingRoutes = require("./routes/mappingRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const previousSubjectRoutes = require("./routes/previousSubjectRoutes");

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.disable("x-powered-by");
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));

app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "degraded",
    service: "transfera-api",
    database: databaseConnected ? "connected" : "unavailable",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/students", studentRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/cancellations", require("./routes/cancellationRoutes"));
app.use("/api/mappings", mappingRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/previous-subjects", previousSubjectRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} was not found` });
});

app.use((error, req, res, next) => {
  if (error.code === "REQUEST_CONFLICT") return res.status(409).json({ message: error.message });
  if (error.code === 11000) return res.status(409).json({ message: "An active request or record already exists" });
  if (["ValidationError", "CastError"].includes(error.name)) return res.status(400).json({ message: error.message });
  if (error.type === "entity.too.large") return res.status(413).json({ message: "Uploaded request is too large" });
  console.error(error);
  res.status(500).json({ message: "An unexpected server error occurred" });
});

module.exports = app;
