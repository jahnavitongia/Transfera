const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const studentRoutes = require("./routes/studentRoutes");
const transferRoutes = require("./routes/transferRoutes");
const mappingRoutes = require("./routes/mappingRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/mappings", mappingRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Transfera API is running"
    });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Transfera server running on port ${PORT}`);
});