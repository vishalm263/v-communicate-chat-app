import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    // Find users the logged-in user has interacted with
    const messages = await Message.find({
      $or: [
        { senderId: loggedInUserId },
        { receiverId: loggedInUserId }
      ]
    }).select("senderId receiverId createdAt seenAt");
    
    // Extract unique user IDs from messages
    const userIdToLatestMessage = new Map();
    const unreadCounts = {};
    
    messages.forEach(message => {
      // Track the latest message for each user
      let otherUserId;
      if (message.senderId.toString() !== loggedInUserId.toString()) {
        otherUserId = message.senderId.toString();
        
        // Count unread messages (messages sent to current user that haven't been seen)
        if (message.receiverId.toString() === loggedInUserId.toString() && !message.seenAt) {
          unreadCounts[otherUserId] = (unreadCounts[otherUserId] || 0) + 1;
        }
      } else {
        otherUserId = message.receiverId.toString();
      }
      
      // Keep track of latest message timestamp per user
      const existingTimestamp = userIdToLatestMessage.get(otherUserId);
      if (!existingTimestamp || message.createdAt > existingTimestamp.createdAt) {
        userIdToLatestMessage.set(otherUserId, {
          createdAt: message.createdAt,
          messageId: message._id,
          senderId: message.senderId.toString(),
          text: message.text,
          isImage: !!message.image
        });
      }
    });
    
    // Sort user IDs by latest message timestamp
    const sortedUserIds = Array.from(userIdToLatestMessage.entries())
      .sort((a, b) => b[1].createdAt - a[1].createdAt)
      .map(entry => entry[0]);
    
    // Find all users from the extracted IDs
    const userDocs = await User.find({ 
      _id: { $in: sortedUserIds } 
    }).select("-password");
    
    // Sort users based on the order in sortedUserIds and add lastMessage and unreadCount
    const filteredUsers = sortedUserIds.map(userId => {
      const user = userDocs.find(u => u._id.toString() === userId);
      if (!user) return null;
      
      const lastMessage = userIdToLatestMessage.get(userId);
      const unreadCount = unreadCounts[userId] || 0;
      
      return {
        ...user.toObject(),
        lastMessage: lastMessage,
        unreadCount: unreadCount
      };
    }).filter(Boolean); // Remove any null entries
    
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).populate({
      path: "replyTo",
      select: "text image senderId"
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;
    
    // Find all unseen messages from this sender to the current user
    const unseenMessages = await Message.updateMany(
      { 
        senderId, 
        receiverId, 
        seenAt: null 
      },
      { 
        seenAt: new Date() 
      }
    );
    
    // Get all the updated message IDs to notify the sender
    const updatedMessages = await Message.find({
      senderId,
      receiverId,
      seenAt: { $ne: null }
    }).select("_id");
    
    const messageIds = updatedMessages.map(msg => msg._id);
    
    // Notify the sender that their messages have been seen
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        messageIds,
        seenAt: new Date(),
        senderId,
        receiverId
      });
    }
    
    res.status(200).json({ success: true, seenCount: unseenMessages.modifiedCount });
  } catch (error) {
    console.log("Error in markMessagesAsSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyToId } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary with optimization settings
      const uploadResponse = await cloudinary.uploader.upload(image, {
        quality: "auto", 
        fetch_format: "auto",
        max_file_size: 10000000, // 10MB
        timeout: 60000,
        resource_type: "image",
        transformation: [
          { width: 1000, crop: "limit" },
          { quality: "auto" }
        ]
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      replyTo: replyToId || null,
    });

    await newMessage.save();

    // Populate the replyTo field if it exists
    if (replyToId) {
      await newMessage.populate({
        path: "replyTo",
        select: "text image senderId"
      });
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    // Check if message exists
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    // Soft delete the message
    message.isDeleted = true;
    message.text = "This message was deleted";
    message.image = "";
    await message.save();

    // Notify the receiver about the message deletion
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const message = await Message.findById(messageId);

    // Check if message exists
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    // Check if message is not already deleted
    if (message.isDeleted) {
      return res.status(400).json({ error: "Deleted messages cannot be edited" });
    }

    // Check if message is less than 15 minutes old (900 seconds)
    const messageAge = (Date.now() - message.createdAt) / 1000;
    if (messageAge > 900) {
      return res.status(400).json({ error: "Messages can only be edited within 15 minutes of sending" });
    }

    // Update the message
    message.text = text;
    message.isEdited = true;
    await message.save();

    // Notify the receiver about the message edit
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await Message.findById(messageId);

    // Check if message exists
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if message is not deleted
    if (message.isDeleted) {
      return res.status(400).json({ error: "Cannot react to a deleted message" });
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      (reaction) => reaction.userId.toString() === userId.toString() && reaction.emoji === emoji
    );

    if (existingReactionIndex !== -1) {
      // Remove the reaction if it already exists (toggle)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add the reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Notify the message sender/receiver about the reaction update
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    if (receiverSocketId && receiverSocketId !== senderSocketId) {
      io.to(receiverSocketId).emit("messageReaction", message);
    }

    if (senderSocketId && userId.toString() !== message.senderId.toString()) {
      io.to(senderSocketId).emit("messageReaction", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in addReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
