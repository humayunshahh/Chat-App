import axios from "axios";

const AI_BASE_URL = "http://localhost:5001/api/ai"; // ✅ Your Node backend now handles it

export async function analyzeSentiment(text) {
  const res = await axios.post(`${AI_BASE_URL}/analyze`, { text });
  return res.data;
}

export async function getReplySuggestions(text) {
  const res = await axios.post(`${AI_BASE_URL}/suggest`, { text });
  return res.data.suggestions;
}

export async function completeMessage(prompt) {
  const res = await axios.post(`${AI_BASE_URL}/complete`, { prompt });
  return res.data.completed;
}

export async function getConversationInsight(conversationText) {
    const response = await fetch("http://127.0.0.1:5005/insight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationText.split("\n"),  // ✅ This ensures it's an array of strings
      }),
    });
  
    if (!response.ok) {
      throw new Error("Insight API error");
    }
  
    return await response.json();
  }

  export async function getAutoReply(message, context = "") {
    const res = await axios.post("http://127.0.0.1:5005/auto-reply", {
      message,
      context,
    });
    return res.data.reply;
  }
  
  
  
