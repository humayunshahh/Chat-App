import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { completeMessage } from "../lib/ai";


const MessageInput = ({ presetText = "", clearPreset }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  // ✅ Handle suggestion being clicked
  useEffect(() => {
    if (presetText) {
      setText(presetText);
      if (clearPreset) clearPreset(); // clear after setting
    }
  }, [presetText]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type?.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleAIComplete = async () => {
    if (!text.trim()) {
      toast.error("Enter a prompt first");
      return;
    }

    try {
      toast.loading("AI writing message...");
      const aiText = await completeMessage(text);
      toast.dismiss();

      if (!aiText || aiText.trim() === "") {
        toast.error("AI returned empty response");
        return;
      }

      await sendMessage({
        text: aiText.trim(),
        image: null,
      });

      setText("");
      toast.success("AI message sent");
    } catch (err) {
      toast.dismiss();
      toast.error("AI failed to complete message");
      console.error(err);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            id="messageInput"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={'hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}'}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>

        {/* ✨ Let AI Write Button */}
        <button
          type="button"
          className="btn btn-sm btn-circle text-purple-500 hover:bg-purple-100"
          onClick={handleAIComplete}
          title="Let AI write your message"
        >
          <Sparkles size={20} />
        </button>

        {/* Send Button */}
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;