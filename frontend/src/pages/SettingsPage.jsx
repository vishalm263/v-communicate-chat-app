import { useState } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Moon, Sun, Computer } from "lucide-react";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const ThemeIcon = ({ theme }) => {
  if (theme === "light") return <Sun className="w-5 h-5" />;
  if (theme === "dark") return <Moon className="w-5 h-5" />;
  return <Computer className="w-5 h-5" />;
};

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const [hideStatus, setHideStatus] = useState(authUser?.hideStatus || false);

  const handleStatusToggle = async () => {
    const newStatus = !hideStatus;
    setHideStatus(newStatus);
    try {
      await updateProfile({ hideStatus: newStatus });
      toast.success(`Online status is now ${newStatus ? 'hidden' : 'visible'} to others`);
    } catch (error) {
      console.error("Error updating status visibility:", error);
      setHideStatus(!newStatus); // Revert UI change on error
      toast.error("Failed to update status visibility");
    }
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Theme</h2>
            <p className="text-sm text-base-content/70">Choose a theme for your chat interface</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`
                  group flex items-center gap-3 p-3 rounded-lg transition-colors
                  ${theme === t ? "bg-base-200 ring-1 ring-primary/30" : "hover:bg-base-200/50"}
                `}
                onClick={() => setTheme(t)}
              >
                <div className="w-8 h-8 rounded-full bg-base-content/10 flex items-center justify-center">
                  <ThemeIcon theme={t} />
                </div>
                <span className="font-medium capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-base-300 rounded-xl p-6 space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Privacy</h2>
            <p className="text-sm text-base-content/70">Manage your privacy settings</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Hide Online Status</h3>
              <p className="text-sm text-base-content/70">
                Others won't be able to see when you're online
              </p>
            </div>
            <input 
              type="checkbox" 
              className="toggle toggle-primary" 
              checked={hideStatus}
              onChange={handleStatusToggle}
              disabled={isUpdatingProfile}
            />
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-base-300 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Preview</h3>
          <div className="rounded-xl overflow-hidden bg-base-100 shadow-lg">
            <div className="p-4 bg-base-200">
              <div className="max-w-lg mx-auto">
                {/* Mock Chat UI */}
                <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                        J
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">John Doe</h3>
                        <p className="text-xs text-base-content/70">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`
                            max-w-[80%] rounded-xl p-3 shadow-sm
                            ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                          `}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`
                              text-[10px] mt-1.5
                              ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                            `}
                          >
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-base-300 bg-base-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-1 text-sm h-10"
                        placeholder="Type a message..."
                        value="This is a preview"
                        readOnly
                      />
                      <button className="btn btn-primary h-10 min-h-0">
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
