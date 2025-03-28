import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./src/lib/db.js";
import authRoutes from "./src/routes/auth.route.js";
import messageRoutes from "./src/routes/message.route.js";

dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? ["https://v-communicate-chat-app.vercel.app", "https://v-communicate-p4v86cyuw-vishalm263s-projects.vercel.app"] 
      : "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Handle preflight requests
app.options('*', cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Error handler for large payloads
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large. Maximum file size is 50MB' });
  }
  next(err);
});

// Connect to database
connectDB();

// Export the Express app for Vercel
export default app; 