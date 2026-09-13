const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Q-CRAFT API Backend', time: new Date().toISOString() });
});

app.post('/api/analyze-blueprint', async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: 'image/jpeg'
      }
    };

    const userPrompt = prompt || 'قم بتحليل هذه المخططات الهندسية/المعمارية بالتفصيل واستخراج الكميات والمواصفات.';

    const result = await model.generateContent([userPrompt, imagePart]);
    const responseText = result.response.text();

    res.json({
      success: true,
      analysis: responseText
    });

  } catch (error) {
    console.error('Error analyzing blueprint:', error);
    res.status(500).json({
      error: 'Failed to analyze blueprint',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Q-CRAFT Backend running on port ${PORT}`);
});

