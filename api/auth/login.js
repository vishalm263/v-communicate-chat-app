// Login API handler
import { MongoClient } from 'mongodb';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import cookie from 'cookie';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Connect to database
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Find user
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      await client.close();
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Compare passwords
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      await client.close();
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Set cookie
    res.setHeader('Set-Cookie', cookie.serialize('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    }));
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    await client.close();
    
    return res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 