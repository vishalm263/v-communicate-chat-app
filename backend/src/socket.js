import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import { getRecipientId } from "./utils/getRecipientId.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 5e7 // 50 MB
});

const userSocketMap = new Map(); // userId -> socketId
const typingUsers = new Map(); // userId -> Set of users they are typing to

// Helper function to set up typing timeout for a user
function setupTypingTimeout(userId, recipientId) {
  // Clear any existing timeout for this user-recipient pair
  const key = `${userId}-${recipientId}`;
  if (typingUsers.has(key)) {
    clearTimeout(typingUsers.get(key).timeout);
  }

  // Set a new timeout
  const timeout = setTimeout(() => {
    // Remove the typing indicator after 3 seconds of inactivity
    if (typingUsers.has(key)) {
      const typingInfo = typingUsers.get(key);
      typingUsers.delete(key);
      
      // Get recipient socket ID and emit typing stopped event
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("userStoppedTyping", {
          userId: userId,
          username: typingInfo.username
        });
      }
    }
  }, 3000);

  return timeout;
}

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  const username = socket.handshake.query.username || "User";
  
  if (userId) {
    userSocketMap.set(userId, socket.id);
    socket.userId = userId;
    socket.username = username;
  }

  // Listen for typing events
  socket.on("typing", (data) => {
    const recipientId = data.recipientId;
    if (!recipientId) return;

    const key = `${userId}-${recipientId}`;
    const recipientSocketId = userSocketMap.get(recipientId);
    
    // Store typing state and set up timeout
    const timeout = setupTypingTimeout(userId, recipientId);
    typingUsers.set(key, { 
      timeout, 
      username 
    });

    // Emit typing event to recipient
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("userTyping", {
        userId: userId,
        username: username
      });
    }
  });

  // Listen for message seen events
  socket.on("markMessagesAsSeen", ({ senderId }) => {
    const receiverId = userId;
    const senderSocketId = userSocketMap.get(senderId);
    
    // Notify the sender that their messages have been seen
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        senderId,
        receiverId,
        seenAt: new Date()
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    
    if (socket.userId) {
      userSocketMap.delete(socket.userId);
      
      // Clean up typing timeouts for this user
      for (const [key, value] of typingUsers.entries()) {
        if (key.startsWith(`${socket.userId}-`)) {
          clearTimeout(value.timeout);
          typingUsers.delete(key);
          
          // Get recipient ID from the key
          const recipientId = key.split('-')[1];
          const recipientSocketId = userSocketMap.get(recipientId);
          
          // Notify recipient that user stopped typing (because they disconnected)
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("userStoppedTyping", {
              userId: socket.userId,
              username: socket.username
            });
          }
        }
      }
    }
    
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });

  // Send online users to the client who just connected
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
});

export { io, server, app, userSocketMap };

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap.get(receiverId);
}; 