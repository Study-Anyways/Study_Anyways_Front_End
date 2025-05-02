const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");

const openAiSecret = defineSecret("OPENAI_API_KEY");

exports.generatePlan = onRequest(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [openAiSecret],
    invoker: "public", 
  },
  async (req, res) => {
    // ✅ CORS 处理：允许前端访问
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // ✅ 预检请求（OPTIONS）直接返回
    if (req.method === "OPTIONS") {
      return res.status(204).send(""); // No Content
    }

    const { topic, time, depth } = req.body;

    if (!topic || !time || !depth) {
      return res.status(400).send("Missing required fields");
    }

    const prompt = `Please generate a detailed study plan for the topic "${topic}". The user has "${time}" available and wants to learn to a "${depth}" level. Break it down into daily or hourly tasks. Be structured, practical, and inspiring.`;

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      });

      res.status(200).json({ result: completion.choices[0].message.content });
    } catch (error) {
      console.error("OpenAI error:", error);
      res.status(500).send("Failed to generate plan");
    }
  }
);