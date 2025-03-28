// Update Profile API handler
import { MongoClient } from 'mongodb';
import { hash } from 'bcryptjs';
import { verify } from 'jsonwebtoken';
import cookie from 'cookie';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get token from cookies
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    // Verify token
    const decoded = verify(token, JWT_SECRET);
    
    // Connect to database
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get user data from request body
    const { fullName, username, password } = req.body;
    
    // Prepare update object
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (username) updateData.username = username;
    if (password) updateData.password = await hash(password, 10);
    
    // Update user in database
    const result = await db.collection('users').updateOne(
      { _id: decoded.userId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      await client.close();
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get updated user data
    const updatedUser = await db.collection('users').findOne(
      { _id: decoded.userId },
      { projection: { password: 0 } }
    );
    
    await client.close();
    
    return res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 