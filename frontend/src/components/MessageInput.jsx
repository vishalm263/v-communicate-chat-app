import { useState, useRef, useEffect } from "react";
import { ImagePlus, Send, X, Reply, Image, Smile } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

// Function to compress image
const compressImage = async (base64Image, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const width = Math.min(maxWidth, img.width);
      const scaleFactor = width / img.width;
      const height = img.height * scaleFactor;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with reduced quality
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };
  });
};

const MessageInput = () => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const imageInputRef = useRef(null);
  const textInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { sendMessage, replyingTo, clearReplyingTo, setUserTyping } = useChatStore();
  const { isUpdatingProfile, authUser, selectedUser } = useAuthStore();

  useEffect(() => {
    if (replyingTo && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [replyingTo]);

  const handleTyping = (e) => {
    setText(e.target.value);
    
    // Set typing status
    if (e.target.value.trim() !== "") {
      setUserTyping(true);
    } else {
      setUserTyping(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (15MB max before compression)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image is too large (max 15MB)");
      return;
    }
    
    setIsProcessingImage(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const originalBase64 = reader.result;
        
        // Show preview immediately
        setImagePreview(originalBase64);
        
        // Compress in background
        try {
          const compressedImage = await compressImage(originalBase64);
          setImage(compressedImage);
          toast.success("Image compressed successfully");
        } catch (error) {
          console.error("Error compressing image:", error);
          setImage(originalBase64); // Fall back to original if compression fails
        }
        
        setIsProcessingImage(false);
      };
      
      reader.onerror = () => {
        toast.error("Error reading file");
        setIsProcessingImage(false);
      };
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
      setIsProcessingImage(false);
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if ((!text || !text.trim()) && !image) return;
    
    if (isProcessingImage) {
      toast.error("Please wait for the image to finish processing");
      return;
    }

    try {
      await sendMessage({ text, image });
      setText("");
      setImage(null);
      setImagePreview(null);
      setUserTyping(false);
    } catch (error) {
      console.log("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleEmojiClick = (emoji) => {
    setText(text + emoji.native);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 border-t border-base-300 bg-base-100"
    >
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-2 p-2 rounded bg-base-200 flex items-start justify-between">
          <div className="flex items-start gap-2 overflow-hidden">
            <div className="p-1 bg-base-300 rounded flex-shrink-0">
              <Reply size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">
                Replying to {replyingTo.senderId === authUser?._id ? 'yourself' : selectedUser?.fullName}
              </p>
              <p className="text-xs truncate text-base-content/70">
                {replyingTo.text || (replyingTo.image ? "Image" : "Message")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-base-content/50 hover:text-base-content"
            onClick={clearReplyingTo}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative mb-2 max-w-xs">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-32 object-cover rounded-md"
            />
            <button
              type="button"
              className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white"
              onClick={() => {
                setImage(null);
                setImagePreview(null);
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input Area with Controls */}
        <div className="flex-1 flex items-end gap-1 bg-base-200 rounded-lg p-1">
          {/* Image Upload */}
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-circle"
            onClick={() => document.getElementById("imageInput").click()}
          >
            <Image size={18} />
            <input
              type="file"
              id="imageInput"
              className="hidden"
              onChange={handleImageChange}
              accept="image/*"
            />
          </button>

          {/* Text Input */}
          <textarea
            value={text}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 py-2 px-2 text-sm"
            rows={text.includes('\n') ? 2 : 1}
            ref={textInputRef}
          />

          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              type="button"
              className="btn btn-sm btn-ghost btn-circle"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={18} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  lazyLoadEmojis
                  theme="light"
                />
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            className={`btn btn-sm ${
              text.trim() || image ? "btn-primary" : "btn-disabled"
            } rounded-full w-10 h-10 min-h-0 p-0 flex items-center justify-center`}
            disabled={!text.trim() && !image}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
