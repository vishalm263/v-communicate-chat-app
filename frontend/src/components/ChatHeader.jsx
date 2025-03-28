import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatTimeAgo } from "../lib/utils";
import { ArrowLeft } from "lucide-react";

const ChatHeader = ({ isTyping }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) && !selectedUser.hideStatus : false;

  return (
    <div className="p-3 flex items-center gap-3 border-b border-base-300">
      {/* Back button for mobile */}
      <button 
        className="md:hidden btn btn-sm btn-ghost" 
        onClick={() => setSelectedUser(null)}
      >
        <ArrowLeft size={20} />
      </button>
      
      <div className="relative">
        <img
          src={selectedUser?.profilePic || "/avatar.png"}
          alt="profile pic"
          className="size-12 rounded-full object-cover"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
        )}
      </div>

      <div className="flex-1">
        <div className="font-semibold">{selectedUser?.fullName}</div>
        <div className="text-xs text-base-content/70 flex items-center">
          {isTyping ? (
            <span className="flex items-center gap-1 text-green-500">
              <span className="animate-pulse">Typing</span>
              <span className="dot-animate">...</span>
            </span>
          ) : isOnline ? (
            "Online"
          ) : selectedUser?.lastSeen ? (
            <>Last seen {formatTimeAgo(selectedUser.lastSeen)}</>
          ) : (
            "Offline"
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
