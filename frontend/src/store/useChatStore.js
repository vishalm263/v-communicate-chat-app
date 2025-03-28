import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  replyingTo: null,
  typingUsers: {}, // {userId: {isTyping: boolean, timestamp: number}}
  typingTimeout: null,
  typingDebounceTime: 1000, // 1 second debounce

  getUsers: async (silentRefresh = false) => {
    // Only show loading state on initial loads, not refreshes
    if (!silentRefresh) {
      set({ isUsersLoading: true });
    }
    
    try {
      const res = await axiosInstance.get("/messages/users-sidebar");
      
      // Filter out unread counts for messages sent by the current user
      const authUserId = useAuthStore.getState().authUser?._id;
      const filteredUsers = res.data.map(user => {
        if (user.lastMessage && user.lastMessage.senderId === authUserId) {
          // If last message is from auth user, we don't show unread count
          return {
            ...user,
            unreadCount: 0
          };
        }
        return user;
      });
      
      set({ users: filteredUsers });
    } catch (error) {
      // Only show errors if not in silent refresh mode
      if (!silentRefresh) {
        toast.error(error.response?.data?.message || "Failed to load contacts");
      } else {
        console.error("Error refreshing users:", error);
      }
    } finally {
      if (!silentRefresh) {
        set({ isUsersLoading: false });
      }
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      
      // Mark messages as seen when loading chat
      get().markMessagesAsSeen(userId);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  
  markMessagesAsSeen: async (senderId) => {
    try {
      // Call the API endpoint to mark messages as seen
      await axiosInstance.post(`/messages/${senderId}/seen`);
      
      // Also emit socket event for real-time updates
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("markMessagesAsSeen", { senderId });
      }
      
      // Update local message state to reflect seen status
      const { messages } = get();
      const updatedMessages = messages.map(message => {
        if (message.senderId === senderId && !message.seenAt) {
          return {
            ...message,
            seenAt: new Date().toISOString()
          };
        }
        return message;
      });
      
      set({ messages: updatedMessages });
      
      // Refresh user list to update unread counts - use silent refresh
      get().getUsers(true);
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  },
  
  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyingTo } = get();
    
    // If there's a message being replied to, add its ID to the message data
    if (replyingTo) {
      messageData.replyToId = replyingTo._id;
    }
    
    try {
      const res = await axiosInstance.post(`/messages/${selectedUser._id}`, messageData);
      set({ 
        messages: [...messages, res.data],
        replyingTo: null // Clear the reply after sending
      });
      
      // Stop typing indicator when message is sent
      get().setUserTyping(false);
      
      // Refresh user list to update last message - use silent refresh
      get().getUsers(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },
  
  editMessage: async (messageId, text) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text });
      
      // Update the message in the local state
      const updatedMessages = messages.map(message => 
        message._id === messageId ? res.data : message
      );
      
      set({ messages: updatedMessages });
      toast.success("Message updated");
      
      // Refresh user list to update last message - use silent refresh
      get().getUsers(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },
  
  deleteMessage: async (messageId) => {
    const { messages } = get();
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      
      // Update the message in the local state
      const updatedMessages = messages.map(message => {
        if (message._id === messageId) {
          return {
            ...message,
            text: "This message was deleted",
            image: "",
            isDeleted: true
          };
        }
        return message;
      });
      
      set({ messages: updatedMessages });
      toast.success("Message deleted");
      
      // Refresh user list to update last message - use silent refresh
      get().getUsers(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },
  
  addReaction: async (messageId, emoji) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/${messageId}/react`, { emoji });
      
      // Update the message in the local state
      const updatedMessages = messages.map(message => 
        message._id === messageId ? res.data : message
      );
      
      set({ messages: updatedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reaction");
    }
  },
  
  setReplyingTo: (message) => {
    set({ replyingTo: message });
  },
  
  clearReplyingTo: () => {
    set({ replyingTo: null });
  },
  
  setUserTyping: (isTyping) => {
    const { selectedUser, typingTimeout, typingDebounceTime } = get();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    
    if (!selectedUser || !socket || !socket.connected || !authUser) return;
    
    // Clear existing timeout if it exists
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set a new timeout - this creates a debounce effect
    const timeout = setTimeout(() => {
      // Send typing status to server
      socket.emit("typing", { 
        isTyping, 
        receiverId: selectedUser._id 
      });
    }, typingDebounceTime);
    
    set({ typingTimeout: timeout });
  },
  
  userIsTyping: (userId) => {
    const { typingUsers } = get();
    const authUser = useAuthStore.getState().authUser;
    
    // Don't show typing indicator for self
    if (authUser?._id === userId) return false;
    
    return typingUsers[userId]?.isTyping || false;
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    if (!socket || !authUser) return;

    // Send username in query for better typing indicators
    if (!socket.io.opts.query) {
      socket.io.opts.query = {};
    }
    socket.io.opts.query.username = authUser.username || authUser.fullName;

    // Listen for new messages
    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
      
      // Clear typing indicator when a message is received
      get().updateTypingStatus(newMessage.senderId, false);
      
      // Mark message as seen immediately if the chat is open
      get().markMessagesAsSeen(newMessage.senderId);
    });
    
    // Listen for messages seen events
    socket.on("messagesSeen", ({ messageIds, seenAt, senderId, receiverId }) => {
      // Only update messages if current user is the sender
      if (senderId !== authUser._id) return;
      
      const { messages } = get();
      const updatedMessages = messages.map(message => {
        // If the message is in the seen messages list, update its seenAt property
        if (!message.seenAt && message.senderId === senderId && message.receiverId === receiverId) {
          return {
            ...message,
            seenAt
          };
        }
        return message;
      });
      
      set({ messages: updatedMessages });
      
      // Refresh user list to update sidebar - use silent refresh
      get().getUsers(true);
    });
    
    // Handle message deletion
    socket.on("messageDeleted", (messageId) => {
      const { messages } = get();
      const updatedMessages = messages.map(message => {
        if (message._id === messageId) {
          return {
            ...message,
            text: "This message was deleted",
            image: "",
            isDeleted: true
          };
        }
        return message;
      });
      
      set({ messages: updatedMessages });
      
      // Refresh user list to update sidebar - use silent refresh
      get().getUsers(true);
    });
    
    // Handle message editing
    socket.on("messageEdited", (updatedMessage) => {
      const { messages } = get();
      const updatedMessages = messages.map(message => 
        message._id === updatedMessage._id ? updatedMessage : message
      );
      
      set({ messages: updatedMessages });
      
      // Refresh user list to update sidebar - use silent refresh
      get().getUsers(true);
    });
    
    // Handle message reactions
    socket.on("messageReaction", (updatedMessage) => {
      const { messages } = get();
      const updatedMessages = messages.map(message => 
        message._id === updatedMessage._id ? updatedMessage : message
      );
      
      set({ messages: updatedMessages });
    });
    
    // Handle typing indicator
    socket.on("userTyping", ({ userId, username }) => {      
      // Don't show typing indicator for yourself
      if (userId === authUser._id) return;
      
      get().updateTypingStatus(userId, true);
    });
    
    // Handle typing stopped
    socket.on("userStoppedTyping", ({ userId }) => {
      if (userId === authUser._id) return;
      
      get().updateTypingStatus(userId, false);
    });
  },
  
  // Helper method to update typing status for a user
  updateTypingStatus: (userId, isTyping) => {
    const { typingUsers } = get();
    
    set({
      typingUsers: {
        ...typingUsers,
        [userId]: {
          isTyping,
          timestamp: Date.now()
        }
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messageEdited");
    socket.off("messageReaction");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("messagesSeen");
  },

  setSelectedUser: (selectedUser) => {
    set({ 
      selectedUser, 
      replyingTo: null,
      // Clear typing indicators when changing chat
      typingUsers: {} 
    });
    
    // Mark messages as seen when changing chat
    if (selectedUser) {
      setTimeout(() => {
        get().markMessagesAsSeen(selectedUser._id);
      }, 1000);
    }
  },
}));
