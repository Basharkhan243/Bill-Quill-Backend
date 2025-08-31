import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Create app
const app = express();

// CORS setup
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://127.0.0.1:5500",
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRouter from "./routes/user.routes.js";
import customerRouter from "./routes/customers.routes.js";

// API routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/customers", customerRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export { app };

