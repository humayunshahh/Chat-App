import { X, MoreVertical } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, messages } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [persona, setPersona] = useState("Friend");
  const [showOptions, setShowOptions] = useState(false);

  const optionsRef = useRef(null); // ⬅️ ref for outside click detection

  const handleSmartSearch = async (e) => {
    if (e.key === "Enter" && query.trim()) {
      try {
        const chatHistory = messages.map((msg) => msg.text || msg.message || "");
        const response = await fetch("http://localhost:5005/smart-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query,
            history: chatHistory,
            persona
          })
        });

        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Smart Search failed:", err);
        setResults([]);
      }
    }
  };

  // ✅ Detect click outside dropdown and close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptions]);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              </div>
            </div>
            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowOptions(!showOptions)}>
              <MoreVertical className="w-5 h-5 text-gray-600 hover:text-black transition-all" />
            </button>
            <button onClick={() => setSelectedUser(null)}>
              <X />
            </button>
          </div>
        </div>

        {/* AI Options (Dropdown Panel) */}
        <div
          ref={optionsRef}
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showOptions ? "max-h-[500px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2"
          }`}
        >
          <div className="flex flex-col gap-2 mt-2">
            {/* AI Persona Dropdown */}
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="persona" className="font-medium">
                🎭 AI Persona:
              </label>
              <select
                id="persona"
                className="border rounded px-2 py-1"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
              >
                <option value="Therapist">🧠 Therapist</option>
                <option value="Friend">👯 Friend</option>
                <option value="Motivational Coach">🏋️ Motivational Coach</option>
              </select>
            </div>

            {/* Smart Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="🔍 Search your chat with AI..."
                className="rounded-md border px-3 py-1 text-sm w-full pr-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSmartSearch}
              />
              {query && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 text-sm"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                >
                  ❌
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AI Smart Search Results */}
        {results.length > 0 && (
          <div className="bg-base-200 border rounded-md p-2 max-h-40 overflow-y-auto text-sm mt-1">
            <p className="font-medium mb-1">🔎 Results:</p>
            <ul className="list-disc list-inside space-y-1">
              {results.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
