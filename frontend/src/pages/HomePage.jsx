import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex items-center justify-center pt-4 md:pt-16 px-2 sm:px-4">
        <div className="bg-base-100 rounded-lg shadow-lg w-full h-[calc(100vh-2rem)] md:h-[calc(100vh-6rem)] md:max-w-6xl overflow-hidden">
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* Hide sidebar on mobile when a chat is selected */}
            <div className={`${selectedUser ? 'hidden md:block' : 'block'}`}>
              <Sidebar />
            </div>

            {/* Show back button on mobile */}
            {!selectedUser ? (
              <NoChatSelected />
            ) : (
              <div className="flex-1 flex flex-col">
                <ChatContainer />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
