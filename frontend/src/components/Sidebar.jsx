import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users } from "lucide-react";

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    userIsTyping 
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    // Initial load with loading indicator
    getUsers().then(() => {
      setInitialLoaded(true);
    });
    
    // Set up interval to refresh users periodically with silent refresh
    refreshTimerRef.current = setInterval(() => {
      getUsers(true); // Silent refresh
    }, 30000); // Every 30 seconds
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [getUsers]);

  // Filter users based on online status and search term
  const filteredUsers = users
    .filter((user) => {
      // Filter by online status if enabled
      if (showOnlineOnly && !onlineUsers.includes(user._id)) {
        return false;
      }
      
      // Filter by search term (fullName or username)
      if (searchTerm) {
        const userFullNameLower = user.fullName.toLowerCase();
        const userUsernameLower = user.username?.toLowerCase() || "";
        const searchTermLower = searchTerm.toLowerCase();
        
        return userFullNameLower.includes(searchTermLower) || 
               userUsernameLower.includes(searchTermLower);
      }
      
      return true;
    });

  // Show skeleton only on initial load, not during subsequent refreshes
  if (isUsersLoading && !initialLoaded) {
    return <SidebarSkeleton />;
  }

  return (
    <aside className="h-full w-20 lg:w-80 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        
        {/* Search Component */}
        <div className="hidden lg:block relative">
          <input
            type="text"
            className="input input-sm input-bordered w-full pl-9"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
        </div>
        
        {/* Online filter toggle */}
        <div className="hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.filter(id => id !== authUser?._id).length} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const isOnline = onlineUsers.includes(user._id) && !user.hideStatus;
            const isTyping = userIsTyping(user._id);
            const hasUnread = user.unreadCount > 0;
            
            return (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`
                  w-full px-3 py-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors relative
                  ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                  ${hasUnread ? "bg-base-200" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-12 object-cover rounded-full"
                  />
                  {isOnline && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                {/* User info - only visible on larger screens */}
                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center justify-between">
                    <span>{user.fullName}</span>
                    {hasUnread && (
                      <span className="badge badge-sm badge-primary ml-2">
                        {user.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">@{user.username}</div>
                  
                  {/* Typing indicator only, no message preview */}
                  {isTyping && (
                    <div className="text-sm text-zinc-400 truncate">
                      <span className="flex items-center gap-1 text-green-500">
                        <span className="animate-pulse">Typing</span>
                        <span className="typing-dots">...</span>
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Mobile view badge */}
                {hasUnread && (
                  <span className="lg:hidden absolute top-1 right-1 badge badge-xs badge-primary">
                    {user.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="text-center text-zinc-500 py-4">
            {searchTerm ? "No users found" : "No contacts available"}
          </div>
        )}
      </div>
      
      <style jsx="true">{`
        @keyframes typing {
          0% { content: ""; }
          25% { content: "."; }
          50% { content: ".."; }
          75% { content: "..."; }
          100% { content: ""; }
        }
        .typing-dots::after {
          content: "";
          animation: typing 1.5s infinite ease-in-out;
        }
      `}</style>
    </aside>
  );
};
export default Sidebar;
