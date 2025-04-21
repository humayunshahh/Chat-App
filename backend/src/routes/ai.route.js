const express = require("express");
const axios = require("axios");
const router = express.Router();
const { analyzeSentiment, suggestReplies, completeMessage,generateAutoReply } = require("../lib/ai");

router.post("/analyze", async (req, res) => {
  try {
    const sentiment = await analyzeSentiment(req.body.text);
    res.json(sentiment);
  } catch (err) {
    console.error("Error calling analyze:", err.message);
    res.status(500).json({ error: "AI analyze failed" });
  }
});

router.post("/suggest", async (req, res) => {
  try {
    const suggestions = await suggestReplies(req.body.text);
    res.json({ suggestions });
  } catch (err) {
    console.error("Error calling suggest:", err.message);
    res.status(500).json({ error: "AI suggest failed" });
  }
});

router.post("/complete", async (req, res) => {
  try {
    const result = await completeMessage(req.body.prompt);
    res.json({ completed: result });
  } catch (err) {
    console.error("Error calling complete:", err.message);
    res.status(500).json({ error: "AI complete failed" });
  }
});

router.post("/auto-reply", async (req, res) => {
    try {
      const { message, context } = req.body;
      const reply = await generateAutoReply(message, context);
      res.json({ reply });
    } catch (err) {
      console.error("Error calling auto-reply:", err.message);
      res.status(500).json({ error: "AI auto-reply failed" });
    }
  });

  router.post("/translate", async (req, res) => {
    const { text, to } = req.body;
  
    if (!text || !to) {
      return res.status(400).json({ error: "Text and target language are required" });
    }
  
    try {
      const response = await axios.post(
        `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${to}`,
        [{ Text: text }],
        {
          headers: {
            "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY,
            "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION,
            "Content-type": "application/json",
          },
        }
      );
  
      const translatedText = response.data[0].translations[0].text;
      res.json({ translatedText });
    } catch (err) {
      console.error("Translation error:", err.message);
      res.status(500).json({ error: "Translation failed" });
    }
  });

module.exports = router;
