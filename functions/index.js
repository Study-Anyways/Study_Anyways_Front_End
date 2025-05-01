const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");

// 1️⃣ 引入 Secret
const openAiSecret = defineSecret("OPENAI_API_KEY");

// 2️⃣ 正确设置为 Cloud Functions 运行选项（带上 secret）
exports.generatePlan = onRequest(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [openAiSecret], // 👈 加上这个
  },
  async (req, res) => {
    const { topic, time, depth } = req.body;

    if (!topic || !time || !depth) {
      return res.status(400).send("Missing required fields");
    }

    const prompt = `Please generate a detailed study plan for the topic "${topic}". The user has "${time}" available and wants to learn to a "${depth}" level. Break it down into daily or hourly tasks. Be structured, practical, and inspiring.`;

    try {
      // ✅ 通过 process.env 读取你设定的密钥
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      });

      res.json(completion);
    } catch (error) {
      console.error("OpenAI error:", error);
      res.status(500).send("Failed to generate plan");
    }
  }
);