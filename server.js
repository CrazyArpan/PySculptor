import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Endpoint for code completion (from existing code)
app.post('/api/complete', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Field 'code' is required." });
    }
    const prompt = `You are a Python code completion assistant. Given the following Python code, provide a single, relevant completion for the last line. Only return the code completion itself, with no explanation, comments, or extra text.\n\nCode:\n---\n${code}\n---\n\nCompletion:`;
    const result = await model.generateContent(prompt);
    const suggestion = result.response.text();
    res.json({ suggestion });
  } catch (error) {
    console.error("AI completion error:", error);
    res.status(500).json({ error: "Failed to get code completion." });
  }
});

// Endpoint for code generation (from a prompt)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Field 'prompt' is required." });
    }
    const aiPrompt = `You are a Python code generator. Write Python code for the following instruction.\n\n- Do NOT include triple backticks, 'python', or any markdown formatting.\n- Return only the code, no explanation, no comments, no markdown, no extra text.\n- If the code is long, return the full code, do not truncate, do not summarize, do not omit any part. Continue until the code is complete.\n- If you generate multiple functions or classes, ensure each starts on a new line and is properly indented.\n- Never put two statements on the same line.\n- Separate each function or class with two newlines.\n- Do not concatenate code blocks.\n\nInstruction:\n---\n${prompt}\n---\n\nPython code:`;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
      generationConfig: { maxOutputTokens: 2048 },
    });
    let suggestion = result.response.text();
    // Remove triple backticks and 'python' if present
    suggestion = suggestion.replace(/```python|```/gi, '').trim();
    // Ensure each 'def' and 'class' starts on a new line
    suggestion = suggestion.replace(/(\S)(def |class )/g, '$1\n$2');
    // Remove any 'breakdef' or similar concatenations
    suggestion = suggestion.replace(/break(def |class )/g, 'break\n$1');
    // Remove duplicate blank lines
    suggestion = suggestion.replace(/\n{3,}/g, '\n\n');
    res.json({ suggestion });
  } catch (error) {
    console.error("AI generation error:", error);
    res.status(500).json({ error: "Failed to generate code." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI proxy server running on port ${PORT}`);
}); 