import app from '../vercel.js';

// This is a special wrapper to handle all HTTP methods in Vercel
export default async function handler(req, res) {
  // Pass the request to the Express app
  return app(req, res);
} 