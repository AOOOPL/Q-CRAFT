const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Q-CRAFT API Backend', time: new Date().toISOString() });
});

// Analyze Blueprint Endpoint
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

    const ai = new GoogleGenAI({ apiKey });

    // Remove base64 data header if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            {
              text: prompt || 'قم بتحليل هذه المخططات الهندسية/المعمارية بالتفصيل واستخراج الكميات والمواصفات.'
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      analysis: response.text
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
