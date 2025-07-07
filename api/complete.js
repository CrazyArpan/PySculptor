import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Field 'code' is required." });
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `You are a Python code completion assistant. Given the following Python code, provide a single, relevant completion for the last line. Only return the code completion itself, with no explanation, comments, or extra text.\n\nCode:\n---\n${code}\n---\n\nCompletion:`;
  try {
    const result = await model.generateContent(prompt);
    const suggestion = result.response.text();
    res.status(200).json({ suggestion });
  } catch (error) {
    console.error("AI completion error:", error);
    res.status(500).json({ error: "Failed to get code completion." });
  }
} 