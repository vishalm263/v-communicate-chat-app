import { updateProfile } from "../../src/controllers/auth.controller.js";
import { protectRoute } from "../../src/middleware/auth.middleware.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { connectDB } from "../../src/lib/db.js";

dotenv.config();

// This function will handle the PUT request for updating profiles
export default async function handler(req, res) {
  // Connect to DB if not already connected
  await connectDB();
  
  // Setup middleware for this specific endpoint
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: process.env.NODE_ENV === "production" 
        ? ["https://v-communicate-chat-app.vercel.app", "https://v-communicate-p4v86cyuw-vishalm263s-projects.vercel.app", "https://v-communicate.vercel.app"] 
        : "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );
  
  // Only handle PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  try {
    // Apply the protectRoute middleware manually
    const authMiddleware = (req, res) => 
      new Promise((resolve, reject) => {
        protectRoute(req, res, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      
    await authMiddleware(req, res);
    
    // If middleware passes, call the controller
    return updateProfile(req, res);
  } catch (error) {
    console.error("Error handling update-profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 