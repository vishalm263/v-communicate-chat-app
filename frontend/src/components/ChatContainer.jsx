import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { CheckCheck, Edit, MessageSquareOff, MoreVertical, Reply, Smile, Trash, X } from "lucide-react";
import toast from "react-hot-toast";

// Available emoji reactions
const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    setReplyingTo,
    deleteMessage,
    editMessage,
    addReaction,
    userIsTyping,
    markMessagesAsSeen
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [activeMessageMenuId, setActiveMessageMenuId] = useState(null);
  const [activeReactionId, setActiveReactionId] = useState(null);

  // Check if selected user is typing
  const isUserTyping = selectedUser ? userIsTyping(selectedUser._id) : false;

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  // Track if we should perform smooth scrolling or instant scrolling
  const [shouldSmoothScroll, setShouldSmoothScroll] = useState(true);
  const chatContainerRef = useRef(null);
  const prevMessagesLength = useRef(0);

  // Improved scrolling behavior - separate for different cases
  useEffect(() => {
    // Skip if no messages
    if (!messages.length) return;
    
    // Initial case - instant scroll to bottom on first load
    if (prevMessagesLength.current === 0 && messages.length > 0) {
      if (messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ behavior: "instant" });
      }
    } 
    // New message case - check if we should auto-scroll
    else if (messages.length > prevMessagesLength.current) {
      const chatContainer = chatContainerRef.current;
      const isScrolledToBottom = chatContainer && 
        (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100);
      
      // If user is at the bottom (or close to it), smooth scroll to the new message
      if (messageEndRef.current && isScrolledToBottom) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
    
    // Update previous length
    prevMessagesLength.current = messages.length;
  }, [messages]);
  
  // Handle scrolling on typing status change
  useEffect(() => {
    if (isUserTyping && messageEndRef.current) {
      const chatContainer = chatContainerRef.current;
      const isScrolledToBottom = chatContainer && 
        (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100);
      
      if (isScrolledToBottom) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [isUserTyping]);
  
  // Add scroll event listener to detect manual scrolling
  useEffect(() => {
    const handleScroll = () => {
      const chatContainer = chatContainerRef.current;
      if (!chatContainer) return;
      
      // If user has scrolled away from bottom, disable auto-scrolling temporarily
      const isScrolledToBottom = 
        chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
      setShouldSmoothScroll(isScrolledToBottom);
    };
    
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Add event listener for when images load to recalculate scroll
  useEffect(() => {
    const handleImageLoad = () => {
      // Only auto-scroll if we're already at the bottom
      if (shouldSmoothScroll && messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };
    
    // Add event listeners to all message images
    const messageImages = document.querySelectorAll('.chat-container img');
    messageImages.forEach(img => {
      img.addEventListener('load', handleImageLoad);
    });
    
    // Cleanup
    return () => {
      messageImages.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
      });
    };
  }, [messages, shouldSmoothScroll]);

  // Mark messages as seen when the user scrolls or interacts with the chat
  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          markMessagesAsSeen(selectedUser._id);
        }
      };
      
      const handleScroll = () => {
        markMessagesAsSeen(selectedUser._id);
      };
      
      // Mark as seen initially
      markMessagesAsSeen(selectedUser._id);
      
      // Set up event listeners
      document.addEventListener('visibilitychange', handleVisibility);
      const chatContainer = document.querySelector('.chat-container');
      if (chatContainer) {
        chatContainer.addEventListener('scroll', handleScroll);
      }
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        if (chatContainer) {
          chatContainer.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [selectedUser, messages, markMessagesAsSeen]);

  const handleReplyClick = (message) => {
    setReplyingTo(message);
    setActiveMessageMenuId(null);
  };

  const handleEditClick = (message) => {
    // Check if message is less than 15 minutes old
    const messageAge = (Date.now() - new Date(message.createdAt)) / 1000;
    if (messageAge > 900) {
      toast.error("Messages can only be edited within 15 minutes of sending");
      return;
    }
    
    setEditingMessage(message);
    setEditText(message.text || "");
    setActiveMessageMenuId(null);
  };

  const handleDeleteClick = async (messageId) => {
    await deleteMessage(messageId);
    setActiveMessageMenuId(null);
  };

  const handleEditCancel = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    
    await editMessage(editingMessage._id, editText);
    setEditingMessage(null);
    setEditText("");
  };

  const handleReactionClick = async (messageId, emoji) => {
    await addReaction(messageId, emoji);
    setActiveReactionId(null);
  };
  
  const handleMoreClick = (messageId) => {
    setActiveMessageMenuId(activeMessageMenuId === messageId ? null : messageId);
    setActiveReactionId(null);
  };
  
  const handleReactionMenuClick = (messageId) => {
    setActiveReactionId(activeReactionId === messageId ? null : messageId);
    setActiveMessageMenuId(null);
  };

  // Function to count reactions by emoji
  const countReactions = (reactions) => {
    const counts = {};
    reactions.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    return counts;
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Get the last message sent by the current user
  const lastOwnMessage = [...messages]
    .reverse()
    .find(message => message.senderId === authUser._id && !message.isDeleted);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader isTyping={isUserTyping} />

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 chat-container" 
        ref={chatContainerRef}
      >
        {/* Message history button - visible when scrolled away from bottom */}
        {!shouldSmoothScroll && messages.length > 10 && (
          <button
            className="btn btn-sm btn-primary fixed bottom-20 right-4 z-10 rounded-full shadow-md"
            onClick={() => {
              if (messageEndRef.current) {
                messageEndRef.current.scrollIntoView({ behavior: "smooth" });
                setShouldSmoothScroll(true);
              }
            }}
          >
            <span>↓ Latest Messages</span>
          </button>
        )}
      
        {messages.map((message, idx) => {
          const isOwnMessage = message.senderId === authUser._id;
          const reactionCounts = countReactions(message.reactions || []);
          const hasUserReacted = (emoji) => 
            message.reactions?.some(r => r.userId === authUser._id && r.emoji === emoji);
            
          // Find the reply source message if this is a reply
          const replySourceMessage = message.replyTo 
            ? messages.find(m => m._id === message.replyTo._id) || message.replyTo
            : null;
            
          // Check if this is the last message from the current user
          const isLastOwnMessage = lastOwnMessage && lastOwnMessage._id === message._id;
          
          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={idx === messages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              
              <div className="chat-header mb-1 flex items-center gap-2">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                  {message.isEdited && <span className="ml-1">(edited)</span>}
                </time>
                
                {/* Seen indicator for own messages */}
                {isOwnMessage && isLastOwnMessage && (
                  <span className="text-xs flex items-center gap-0.5 text-primary opacity-80">
                    <CheckCheck size={12} className={message.seenAt ? 'fill-primary' : ''} />
                    {message.seenAt ? 'Seen' : 'Sent'}
                  </span>
                )}
              </div>
              
              {/* Editing UI */}
              {editingMessage && editingMessage._id === message._id ? (
                <div className="chat-bubble flex flex-col p-2">
                  <textarea
                    className="textarea textarea-bordered w-full mb-2"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={handleEditCancel}
                      className="btn btn-sm btn-ghost"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleEditSubmit}
                      className="btn btn-sm btn-primary"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  {/* Reply reference */}
                  {replySourceMessage && (
                    <div className="chat-bubble chat-bubble-info p-2 mb-1 opacity-70">
                      <div className="text-xs font-medium mb-1">
                        Replying to {replySourceMessage.senderId === authUser._id ? 'yourself' : selectedUser.fullName}
                      </div>
                      <p className="text-sm truncate">
                        {replySourceMessage.text || (replySourceMessage.image ? "Image" : "Message")}
                      </p>
                    </div>
                  )}
                  
                  <div className="chat-bubble flex flex-col relative">
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2"
                      />
                    )}
                    {message.isDeleted ? (
                      <div className="flex items-center gap-2 italic opacity-60">
                        <MessageSquareOff size={14} />
                        <span>{message.text}</span>
                      </div>
                    ) : (
                      <p>{message.text}</p>
                    )}
                    
                    {/* Action buttons */}
                    {!message.isDeleted && (
                      <div 
                        className={`
                          absolute ${isOwnMessage ? 'left-0' : 'right-0'} top-0 -m-2
                          opacity-0 group-hover:opacity-100 transition-opacity
                          flex gap-1
                        `}
                      >
                        {/* Reaction button */}
                        <button 
                          onClick={() => handleReactionMenuClick(message._id)}
                          className="btn btn-circle btn-xs bg-base-100"
                        >
                          <Smile size={12} />
                        </button>
                        
                        {/* Reply button */}
                        <button 
                          onClick={() => handleReplyClick(message)}
                          className="btn btn-circle btn-xs bg-base-100"
                        >
                          <Reply size={12} />
                        </button>
                        
                        {/* More options button (only for own messages) */}
                        {isOwnMessage && (
                          <button 
                            onClick={() => handleMoreClick(message._id)}
                            className="btn btn-circle btn-xs bg-base-100"
                          >
                            <MoreVertical size={12} />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Reaction emoji menu */}
                    {activeReactionId === message._id && (
                      <div className="absolute top-0 -mt-10 bg-base-200 rounded-full px-2 py-1 flex gap-1 shadow-lg">
                        {EMOJI_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(message._id, emoji)}
                            className={`text-lg hover:scale-125 transition-transform ${
                              hasUserReacted(emoji) ? 'opacity-50' : 'opacity-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button 
                          onClick={() => setActiveReactionId(null)}
                          className="ml-1 text-base-content/50 hover:text-base-content"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    {/* More options menu (for edit/delete) */}
                    {activeMessageMenuId === message._id && (
                      <div className="absolute top-0 -mt-20 right-0 bg-base-200 rounded-lg shadow-lg overflow-hidden">
                        <button 
                          onClick={() => handleEditClick(message)}
                          className="flex items-center gap-2 px-3 py-2 w-full hover:bg-base-300 text-left"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(message._id)}
                          className="flex items-center gap-2 px-3 py-2 w-full hover:bg-base-300 text-left text-error"
                        >
                          <Trash size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Reactions display */}
                  {Object.keys(reactionCounts).length > 0 && (
                    <div className="chat-footer opacity-75 flex flex-wrap gap-1 mt-1">
                      {Object.entries(reactionCounts).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReactionClick(message._id, emoji)}
                          className={`bg-base-200 rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 hover:bg-base-300 ${
                            hasUserReacted(emoji) ? 'ring-1 ring-primary/30' : ''
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isUserTyping && (
          <div className="chat chat-start" ref={messageEndRef}>
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-bubble chat-bubble-info flex gap-1 items-center py-2 px-4 min-h-0">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <style jsx="true">{`
                .typing-dot {
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  background-color: currentColor;
                  animation: typingAnimation 1.5s infinite ease-in-out;
                }
                .typing-dot:nth-child(2) {
                  animation-delay: 0.5s;
                }
                .typing-dot:nth-child(3) {
                  animation-delay: 1s;
                }
                @keyframes typingAnimation {
                  0% { opacity: 0.2; transform: scale(0.8); }
                  50% { opacity: 1; transform: scale(1.1); }
                  100% { opacity: 0.2; transform: scale(0.8); }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
