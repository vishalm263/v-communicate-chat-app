import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// Track typing status with timeouts
const typingUsers = new Map(); // {userId_receiverId: timeout}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle typing events
  socket.on("typing", ({ isTyping, receiverId }) => {
    if (!userId || !receiverId) return;
    
    const receiverSocketId = userSocketMap[receiverId];
    if (!receiverSocketId) return;
    
    const typingKey = `${userId}_${receiverId}`;
    
    // Clear any existing timeout for this user-receiver pair
    if (typingUsers.has(typingKey)) {
      clearTimeout(typingUsers.get(typingKey));
    }
    
    if (isTyping) {
      // Send typing indicator to receiver
      io.to(receiverSocketId).emit("userTyping", { 
        isTyping: true, 
        senderId: userId,
        senderName: socket.handshake.query.username || "User"
      });
      
      // Set timeout to automatically turn off typing status after 5 seconds
      const timeout = setTimeout(() => {
        if (userSocketMap[receiverId]) {
          io.to(userSocketMap[receiverId]).emit("userTyping", { 
            isTyping: false, 
            senderId: userId
          });
        }
        typingUsers.delete(typingKey);
      }, 5000);
      
      typingUsers.set(typingKey, timeout);
    } else {
      // Send stop typing immediately
      io.to(receiverSocketId).emit("userTyping", { 
        isTyping: false, 
        senderId: userId
      });
      typingUsers.delete(typingKey);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    
    // Clean up typing indicators for this user
    if (userId) {
      // Remove all typing indicators where this user is the sender
      for (const [key, timeout] of typingUsers.entries()) {
        if (key.startsWith(`${userId}_`)) {
          clearTimeout(timeout);
          typingUsers.delete(key);
          
          // Extract receiverId from the key
          const receiverId = key.split('_')[1];
          const receiverSocketId = userSocketMap[receiverId];
          
          // Notify receiver that user is no longer typing
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", { 
              isTyping: false, 
              senderId: userId 
            });
          }
        }
      }
    }
    
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
