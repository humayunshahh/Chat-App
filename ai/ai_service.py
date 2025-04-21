from flask import Flask, request, jsonify
import json
from flask_cors import CORS
from transformers import pipeline
import google.generativeai as genai
from dotenv import load_dotenv
import os

# ✅ Load environment variables before using them
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / "backend" / ".env")

# ✅ Retrieve the API key after loading .env
google_api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=google_api_key)
GEMINI_MODEL = "models/gemini-1.5-flash"

print("Google API key loaded:", bool(google_api_key))  # Should be True

app = Flask(__name__)
CORS(app)

# ✅ Load sentiment model only
sentiment_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    text = data.get("text", "")
    result = sentiment_model(text)
    return jsonify(result)


@app.route("/suggest", methods=["POST"])
def suggest():
    data = request.json
    text = data.get("text", "").strip()

    prompt = (
        f"Someone said: \"{text}\"\n"
        f"Write 3 short, friendly and helpful replies to this message.\n"
        f"Each reply should be on a new line, under 20 words, and not repeat the original message."
    )

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        raw = response.text.strip()
        suggestions = [line.strip("-•1234567890. ").strip() for line in raw.split("\n") if line.strip()]
        return jsonify({"suggestions": suggestions[:3]})
    except Exception as e:
        print("Gemini Suggest Error:", e)
        return jsonify({"suggestions": []}), 500


@app.route("/complete", methods=["POST"])
def complete():
    data = request.json
    prompt_input = data.get("prompt", "").strip()

    prompt = (
        f"Continue this personal sentence in first person without asking a question.\n"
        f"It should sound emotionally consistent and coherent.\n"
        f"Input: {prompt_input}\n"
        f"Output:"
    )

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        result = response.text.strip()
        return jsonify({"completed": result})
    except Exception as e:
        print("Gemini Complete Error:", e)
        return jsonify({"completed": ""}), 500

@app.route("/insight", methods=["POST"])
def insight():
    try:
        data = request.get_json(force=True)
        messages = data.get("messages", [])

        if not isinstance(messages, list) or not all(isinstance(m, str) for m in messages):
            return jsonify({ "error": "Invalid 'messages' format" }), 400

        if not messages:
            return jsonify({ "error": "No messages provided." }), 400

        prompt = (
            f"Here are the last 10 messages in a conversation:\n\n"
            + "\n".join(messages)
            + "\n\nPlease summarize the conversation and provide the overall mood and interaction tone. "
              "Also include a breakdown of the emotions expressed if any."
        )

        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)

        return jsonify({
            "summary": response.text.strip(),
            "sentimentDistribution": {
                "Joy": 40,
                "Sadness": 10,
                "Neutral": 50
            }
        })

    except Exception as e:
        print("Insight error:", e)
        return jsonify({ "error": str(e) }), 500

@app.route("/auto-reply", methods=["POST"])
def auto_reply():
    try:
        data = request.json
        message = data.get("message", "")
        context = data.get("context", "")

        prompt = (
            f"You are replying as a normal person in a chat conversation.\n"
            f"Respond to the message: \"{message}\"\n"
            f"{'Conversation context:\n' + context if context else ''}\n"
            f"Your reply should be realistic, concise (under 25 words), and practical.\n"
            f"Don’t repeat the original message. Avoid dramatic or poetic language.\n"
            f"Reply like how you would respond in a chat app.\n\n"
            f"Reply:"
        )

        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        return jsonify({ "reply": response.text.strip() })

    except Exception as e:
        print("AutoReply Error:", e)
        return jsonify({ "reply": "" }), 500



if __name__ == "__main__":
    app.run(port=5005)
