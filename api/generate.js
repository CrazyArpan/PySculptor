import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ error: "Field 'prompt' is required." });
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const aiPrompt = `You are a Python code generator. Write Python code for the following instruction.\n\n- Do NOT include triple backticks, 'python', or any markdown formatting.\n- Return only the code, no explanation, no comments, no markdown, no extra text.\n- If the code is long, return the full code, do not truncate, do not summarize, do not omit any part. Continue until the code is complete.\n- If you generate multiple functions or classes, ensure each starts on a new line and is properly indented.\n- Never put two statements on the same line.\n- Separate each function or class with two newlines.\n- Do not concatenate code blocks.\n\nInstruction:\n---\n${prompt}\n---\n\nPython code:`;
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
      generationConfig: { maxOutputTokens: 2048 },
    });
    let suggestion = result.response.text();
    suggestion = suggestion.replace(/```python|```/gi, '').trim();
    suggestion = suggestion.replace(/(\S)(def |class )/g, '$1\n$2');
    suggestion = suggestion.replace(/break(def |class )/g, 'break\n$1');
    suggestion = suggestion.replace(/\n{3,}/g, '\n\n');
    res.status(200).json({ suggestion });
  } catch (error) {
    console.error("AI generation error:", error);
    res.status(500).json({ error: "Failed to generate code." });
  }
} 