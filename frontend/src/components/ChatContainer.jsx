    import { useChatStore } from "../store/useChatStore";
    import { useEffect, useRef, useState } from "react";
    import ChatHeader from "./ChatHeader";
    import MessageInput from "./MessageInput";
    import MessageSkeleton from "./skeletons/MessageSkeleton";
    import { useAuthStore } from "../store/useAuthStore";
    import { formatMessageTime } from "../lib/utils";
    import axios from "axios";


    // ✅ AI Integration
    import {
      analyzeSentiment,
      getReplySuggestions,
      getConversationInsight,
      completeMessage,
      getAutoReply
    } from "../lib/ai";

    function showMessageNotification({ senderName, text }, onClickAutoReply) {
      console.log("🔔 Notification Triggered →", { senderName, text });
    
      if (Notification.permission === "granted") {
        const notification = new Notification(`${senderName} says: ${text}`, {
          icon: "/avatar.png"
        });
    
        notification.onclick = () => {
          window.focus();
          onClickAutoReply();
        };
    
        new Audio("/notification.wav").play().catch(() => {});
      }
    }
    
    const ChatContainer = () => {
      const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        sendMessage,
        subscribeToMessages,
        unsubscribeFromMessages,
      } = useChatStore();

      const { authUser } = useAuthStore();
      const messageEndRef = useRef(null);

      const [messageSentiments, setMessageSentiments] = useState({});
      const [aiSuggestions, setAiSuggestions] = useState([]);
      const [selectedSuggestion, setSelectedSuggestion] = useState("");

      // ✅ Insight
      const [insightPopup, setInsightPopup] = useState(false);
      const [chatInsight, setChatInsight] = useState("");
      const [sentimentChartData, setSentimentChartData] = useState({});

      // ✅ AI Autopilot Mode
      const [aiMode, setAiMode] = useState(false);

      useEffect(() => {
        getMessages(selectedUser._id);
        subscribeToMessages();
        return () => unsubscribeFromMessages();
      }, [selectedUser._id]);

      useEffect(() => {
        if (messageEndRef.current && messages.length > 0) {
          messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      
          const lastMessage = messages[messages.length - 1];
      
          const processMessage = async () => {
            if (
              lastMessage.senderId !== authUser._id &&
              lastMessage._id !== messageSentiments.lastAnalyzedId
            ) {
              analyzeSentiment(lastMessage.text).then((result) => {
                setMessageSentiments((prev) => ({
                  ...prev,
                  [lastMessage._id]: result[0].label,
                  lastAnalyzedId: lastMessage._id,
                }));
              });
      
              getReplySuggestions(lastMessage.text).then((suggestions) => {
                const uniqueSuggestions = [...new Set(suggestions.map((s) => s.trim()))].slice(0, 3);
                setAiSuggestions(uniqueSuggestions);
              });
      
              // ✅ Translate message
              if (authUser?.preferredLanguage && lastMessage.senderId !== authUser._id) {
                try {
                  const response = await axios.post("http://localhost:5001/api/ai/translate", {
                    text: lastMessage.text,
                    to: authUser.preferredLanguage,
                  });
                  lastMessage.translated = response.data.translatedText;
                } catch (err) {
                  console.warn("Translation failed", err);
                }
              }
      
              // ✅ AI Autopilot
              if (aiMode) {
                handleAutoReply(lastMessage.text);
              }
      
              const messageWithName = {
                ...lastMessage,
                senderName: selectedUser?.name || "New User"
              };
      
              showMessageNotification(messageWithName, () => {
                setAiMode(true);
                handleAutoReply(lastMessage.text);
              });
            }
          };
      
          processMessage(); // ✅ Call async function
        }
      }, [messages]);

      const handleAutoReply = async (incomingText) => {
        try {

          // Add delay before AI replies (e.g., 1.5 seconds)
          await new Promise((resolve) => setTimeout(resolve, 3000));

          const reply = await getAutoReply(incomingText);
          if (reply) {
            await sendMessage({ text: reply, image: null });
          }
        } catch (error) {
          console.error("AI Autopilot Error:", error);
        }
      };

      const handleShowInsight = async () => {
        const last10 = messages
          .slice(-10)
          .map((m) => `${m.senderId === authUser._id ? "You" : "Friend"}: ${m.text}`)
          .join("\n");

        const result = await getConversationInsight(last10);

        if (result?.summary) {
          setChatInsight(result.summary);
        }

        if (result?.sentimentDistribution) {
          setSentimentChartData(result.sentimentDistribution);
        }

        setInsightPopup(true);
      };

      return (
        <div className="flex-1 flex flex-col overflow-auto">
          <ChatHeader />

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={message._id}
                className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                ref={idx === messages.length - 1 ? messageEndRef : null}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        message.senderId === authUser._id
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser.profilePic || "/avatar.png"
                      }
                      alt="profile pic"
                    />
                  </div>
                </div>
                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div className="chat-bubble flex flex-col">
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                  {message.translated && (
                    <p className="text-xs text-indigo-500 mt-1 italic">🌐 {message.translated}</p>
                  )}


                  {messageSentiments[message._id] && (
                    <span className="mt-1 text-xs text-gray-500 italic">
                      Detected Mood: {messageSentiments[message._id]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ✅ AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="px-4 py-2 border-t bg-gray-50 flex gap-2 flex-wrap">
              {aiSuggestions.map((sug, i) => (
                <button
                  key={i}
                  className="px-3 py-1 rounded bg-blue-200 hover:bg-blue-200 text-sm text-black"
                  onClick={() => setSelectedSuggestion(sug)}
                >
                  💡 {sug}
                </button>
              ))}
            </div>
          )}

          {/* ✅ AI Mode Toggle & Insight */}
          <div className="px-4 py-2 border-t bg-gray-100 flex justify-between items-center">
            <button
              onClick={handleShowInsight}
              className="btn btn-sm bg-indigo-600 text-white hover:bg-indigo-700"
            >
              📊 View Insight
            </button>
            <label className="text-xs flex gap-2 items-center text-black">
              <input
                type="checkbox"
                checked={aiMode}
                onChange={(e) => setAiMode(e.target.checked)}
              />
              Enable AI Mode
            </label>
          </div>

          {/* ✅ Insight Popup */}
          {insightPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-lg shadow-lg w-[400px] max-w-[90%] p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-blue-800">Conversation Insight</h4>
                  <button onClick={() => setInsightPopup(false)} className="text-gray-500 text-xs">✖</button>
                </div>

                <p className="text-xs text-gray-700 whitespace-pre-wrap mb-3">{chatInsight}</p>

                {sentimentChartData && Object.keys(sentimentChartData).length > 0 && (
                  <div>
                    {Object.entries(sentimentChartData).map(([label, value]) => (
                      <div key={label} className="mb-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{label}</span>
                          <span>{value}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded">
                          <div className="h-2 bg-indigo-500 rounded" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <MessageInput presetText={selectedSuggestion} clearPreset={() => setSelectedSuggestion("")} />
        </div>
      );
    };

    export default ChatContainer;
