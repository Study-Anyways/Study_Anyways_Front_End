// 1) Import everything
const https = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");
const cors = require("cors");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (!admin.apps.length) admin.initializeApp();
const db = getFirestore();

const openAiSecret = defineSecret("OPENAI_API_KEY");
const corsHandler = cors({ origin: true });



exports.generatePlan = https.onRequest(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [openAiSecret],
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(500).send("No API key");

      // 1) Pull exactly your fields
      const {
        topic,
        totalDuration,
        goal,
        uid,
        details,
        dailyHours,
        responseStyle,
        resources,
        learningStyles
      } = req.body;

      if (!topic || !totalDuration || !goal) {
        return res.status(400).send("Missing required fields");
      }

      // 2) Set up prompts
      const systemMsg = {
        role: "system",
        content: `
You’re a study-plan generator. ALWAYS format like this:

###Introduction
[short intro, briefly summarise the area, applications, potential occupations and salary]

###Main Content
[detailed plan, give what the user should do]

###Resources
[Give the user 3-5 links, or famous books, or lessons notes link to help]

###Strategies
[Give the user 1-2 top tips on the internet about studying in this area]

No extra text.`
      };
      const userPrompt = `
Create a motivating study plan more than 800 words less than 1500 on "${topic}".
Details: ${details}.
Total time: ${totalDuration}, ${dailyHours}h/day to reach "${goal}" level.
Style: ${responseStyle}.
Resources: ${resources}.
Learning Styles: ${Array.isArray(learningStyles)? learningStyles.join(", "): "none"}.
In whatever situation, be as concise as possible, control the whole answers below 1500 tokens.`;


      try {
        // 3) Call OpenAI
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          max_tokens: 2048,
          messages: [systemMsg, { role: "user", content: userPrompt }]
        });

        const raw = completion.choices[0].message.content;
        console.log("Raw AI:", raw);

        // 4) Slice into 3 sections
        // four-part regex (with Strategies optional)
const pattern =
  /###Introduction\n([\s\S]*?)\n###Main Content\n([\s\S]*?)\n###Resources\n([\s\S]*?)(?:\n###Strategies\n([\s\S]*))?$/;
const m = raw.match(pattern);
if (!m) throw new Error("Unexpected AI format");
const [, introduction, mainContent, resources, strategies = ""] = m;



        // 5) Save to Firestore (use totalDuration & goal, not time/depth)
        await db.collection("history").add({
          uid: uid || "anonymous",
          topic,
          totalDuration,
          goal,
          details,
          dailyHours,
          responseStyle,
          resources,
          learningStyles,
          response: raw,
          createdAt: new Date(),
        });

        // then return all four json:
return res.json({
  introduction: introduction.trim(),
  mainContent:  mainContent.trim(),
  resources:    resources.trim(),
  strategies:   strategies.trim()
});

      } catch (err) {
        console.error("generatePlan error:", err);
        return res.status(500).json({ error: err.message });
      }
    });
  }
);