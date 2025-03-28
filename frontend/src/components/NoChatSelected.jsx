import { MessageSquare } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 bg-base-200/50">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center size-16 bg-base-300 rounded-full mb-4">
          <MessageSquare className="size-8 text-primary/70" />
        </div>
        <h3 className="text-xl font-bold mb-2">Your Messages</h3>
        <p className="text-base-content/70 text-sm md:text-base">
          Select a contact to start chatting. Your conversations will appear here.
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
