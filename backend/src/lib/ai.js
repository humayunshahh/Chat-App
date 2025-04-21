const axios = require("axios");

const AI_BASE_URL = "http://127.0.0.1:5005";  // Use IP instead of localhost for consistency

async function analyzeSentiment(text) {
  const res = await axios.post(`${AI_BASE_URL}/analyze`, { text });
  return res.data;
}

async function suggestReplies(text) {
  const res = await axios.post(`${AI_BASE_URL}/suggest`, { text });
  return res.data.suggestions;
}

async function completeMessage(prompt) {
  const res = await axios.post(`${AI_BASE_URL}/complete`, { prompt });
  return res.data.completed;
}

// ✅ Add this
async function getConversationInsight(messages) {
  const res = await axios.post(`${AI_BASE_URL}/insight`, { messages });
  return res.data.insight ? { summary: res.data.insight } : null;
}

async function generateAutoReply(message, context = "") {
    const res = await axios.post(`${AI_BASE_URL}/auto-reply`, { message, context });
    return res.data.reply;
  }
  

module.exports = {
  analyzeSentiment,
  suggestReplies,
  completeMessage,
  getConversationInsight,  // ✅ Export it here
  generateAutoReply // ✅ Add this
};
