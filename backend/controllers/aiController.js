const Task = require('../models/Task');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const askGemini = async (prompt, retries = 2) => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing. Add it to your .env file.');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini returned an empty response');
      }
      return text.trim();
    }

    // 503 = model temporarily overloaded — worth retrying after a short wait
    if (response.status === 503 && attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      continue;
    }

    const errBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errBody}`);
  }
};

const getRecommendation = async (req, res, next) => {
  try {
    const pendingTasks = await Task.find({ userId: req.user.id, status: 'Pending' });

    if (pendingTasks.length === 0) {
      return res.status(200).json({ recommendation: "You're all caught up! No pending tasks right now." });
    }

    const taskList = pendingTasks.map((t, i) =>
      `${i + 1}. "${t.title}" — Priority: ${t.priority}, Category: ${t.category}${t.deadline ? `, Deadline: ${new Date(t.deadline).toDateString()}` : ', No deadline'}`
    ).join('\n');

    const prompt = `You are a calm, encouraging productivity assistant inside a task app used by people in ANY profession — students, doctors, engineers, lawyers, anyone. Someone has these pending tasks:

${taskList}

In 2-3 short, friendly sentences, tell them exactly ONE task they should do first and briefly say why (consider deadlines and priority). Keep it calm and reassuring, not stressful. Plain text only, no markdown.`;

    const recommendation = await askGemini(prompt);
    res.status(200).json({ recommendation });
  } catch (err) {
    next(err);
  }
};

const getInsights = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });

    if (tasks.length === 0) {
      return res.status(200).json({ insights: "You haven't added any tasks yet. Add a few to start getting insights!" });
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const overdue = tasks.filter(t =>
      t.status === 'Pending' && t.deadline && new Date(t.deadline) < new Date()
    ).length;

    const categoryCounts = tasks.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});
    const categorySummary = Object.entries(categoryCounts).map(([cat, count]) => `${cat}: ${count}`).join(', ');

    const prompt = `You are a warm, encouraging productivity coach inside a task app used by people of ANY profession. Here is someone's task data:

Total tasks: ${total}
Completed: ${completed}
Pending: ${pending}
Overdue: ${overdue}
Tasks by category: ${categorySummary}

Write a short, friendly 3-4 sentence summary of how they're doing. Mention what's going well, gently flag anything overdue without being harsh, and end with one encouraging, practical tip. Plain text only, no markdown, no bullet points.`;

    const insights = await askGemini(prompt);
    res.status(200).json({ insights });
  } catch (err) {
    next(err);
  }
};

const getTodaysPlan = async (req, res, next) => {
  try {
    const pendingTasks = await Task.find({ userId: req.user.id, status: 'Pending' });

    if (pendingTasks.length === 0) {
      return res.status(200).json({ plan: "You have no pending tasks. Enjoy your free time!" });
    }

    const taskList = pendingTasks.map((t, i) =>
      `${i + 1}. "${t.title}" — Priority: ${t.priority}, Category: ${t.category}${t.deadline ? `, Deadline: ${new Date(t.deadline).toDateString()}` : ', No deadline'}`
    ).join('\n');

    const prompt = `You are a calm, practical productivity assistant inside a task app used by people of ANY profession — students, doctors, engineers, lawyers, anyone. Here are someone's pending tasks:

${taskList}

Suggest a realistic order to tackle these TODAY, considering priority and deadlines. Write it as a short numbered list (max 5 items — pick only the most important ones if there are more), each with a few words of reasoning. Keep the tone calm and supportive, not overwhelming. Plain text only, no markdown like asterisks.`;

    const plan = await askGemini(prompt);
    res.status(200).json({ plan });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/productivity-score
const getProductivityScore = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });

    if (tasks.length === 0) {
      return res.status(200).json({
        score: null,
        summary: "Add a few tasks first, then come back for your productivity score!",
      });
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const overdue = tasks.filter(t =>
      t.status === 'Pending' && t.deadline && new Date(t.deadline) < new Date()
    ).length;

    const categoryCounts = tasks.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});
    const categorySummary = Object.entries(categoryCounts).map(([cat, count]) => `${cat}: ${count}`).join(', ');

    const memberSince = req.user.createdAt ? new Date(req.user.createdAt).toDateString() : 'unknown';

    const prompt = `You are an encouraging productivity coach inside a task app used by people of ANY profession. Here is someone's account data:

Member since: ${memberSince}
Total tasks: ${total}
Completed: ${completed}
Pending: ${pending}
Overdue: ${overdue}
Tasks by category: ${categorySummary}

Generate a productivity score from 0 to 100, where 100 means excellent momentum (consider consistent effort, not just perfection — someone with a few overdue tasks but generally on top of things can still score well). Then write a short, warm 2-3 sentence explanation.

Respond in EXACTLY this format and nothing else, no markdown:
SCORE: <number>
SUMMARY: <your explanation>`;

    const raw = await askGemini(prompt);

    const scoreMatch = raw.match(/SCORE:\s*(\d+)/i);
    const summaryMatch = raw.match(/SUMMARY:\s*([\s\S]*)/i);

    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : null;
    const summary = summaryMatch ? summaryMatch[1].trim() : raw;

    res.status(200).json({ score, summary });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRecommendation, getInsights, getTodaysPlan, getProductivityScore };