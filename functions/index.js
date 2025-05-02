const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");
const cors = require("cors");

// ✅ 添加 Firestore 支持
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
if (!admin.apps.length) admin.initializeApp();
const db = getFirestore();

// ✅ 定义 OPENAI_API_KEY secret
const openAiSecret = defineSecret("OPENAI_API_KEY");

// ✅ 设置 CORS 策略（允许所有来源）
const corsHandler = cors({ origin: true });

// ✅ 导出函数
exports.generatePlan = onRequest(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [openAiSecret],
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.error("❌ OPENAI_API_KEY not set");
        return res.status(500).send("Server misconfiguration: No API Key");
      }

      const { topic, time, depth, uid } = req.body; // ✅ 接收 uid（可从前端传）

      console.log("📥 Received request with:", { topic, time, depth, uid });

      if (!topic || !time || !depth) {
        console.warn("⚠️ Missing required fields");
        return res.status(400).send("Missing required fields");
      }

      const prompt = `Please generate a detailed study plan for the topic "${topic}". The user has "${time}" available and wants to learn to a "${depth}" level. Break it down into daily or hourly tasks. Be structured, practical, and inspiring.`;

      try {
        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        });

        const result = completion.choices?.[0]?.message?.content || "";
        console.log("✅ OpenAI response:", result);

        // ✅ 写入 Firestore 历史记录
        await db.collection("history").add({
          uid: uid || "anonymous",
          topic,
          time,
          depth,
          response: result,
          createdAt: new Date()
        });

        res.json({ message: result });
      } catch (error) {
        console.error("❌ OpenAI API error:", error);
        res.status(500).send("Failed to generate plan");
      }
    });
  }
);