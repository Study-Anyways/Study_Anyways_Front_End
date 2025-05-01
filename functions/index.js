const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");
const cors = require("cors"); // ✅ 引入 CORS

const openAiSecret = defineSecret("OPENAI_API_KEY");

const corsHandler = cors({ origin: true }); // ✅ 允许所有域名跨域访问

exports.generatePlan = onRequest(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [openAiSecret],
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
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

        res.json(completion);
      } catch (error) {
        console.error("OpenAI error:", error);
        res.status(500).send("Failed to generate plan");
      }
    });
  }
);