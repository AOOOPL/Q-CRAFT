const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Q-CRAFT API Backend', model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', time: new Date().toISOString() });
});

app.post('/api/analyze-blueprint', async (req, res) => {
  try {
    const imageBase64 = req.body.imageBase64 || req.body.image || req.body.imageData || req.body.data;
 const prompt = req.body.prompt || "Analyze this floor plan blueprint and return the 3D dimensions and elements structure";


    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

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


