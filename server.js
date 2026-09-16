const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Q-CRAFT API Backend',
    model: process.env.GEMINI_MODEL || '3.5-flash-lite',
    time: new Date().toISOString()
  });
});

async function analyzeWithGemini(req, res) {
  try {
    const image =
      req.body.image ||
      req.body.imageBase64 ||
      req.body.imageData ||
      req.body.data;

    const prompt =
      req.body.prompt ||
      'Analyze this interior design or floor plan image and return only a JSON array of measurable editable CAD objects. Use millimetres. Every object should include type, width, length, z_height, z_elevation, shape, confidence, and source. If dimensions are not visible, mark source as standard or estimated.';

    if (!image) {
      return res.status(400).json({
        error: {
          message: 'No image was provided.'
        }
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: {
          message: 'GEMINI_API_KEY is not configured on the server.'
        }
      });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const cleanImage = image.replace(
      /^data:image\/[^;]+;base64,/,
      ''
    );

    const mimeMatch = image.match(/^data:(image\/[^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const imagePart = {
      inlineData: {
        data: cleanImage,
        mimeType
      }
    };

    const result = await model.generateContent([
      prompt,
      imagePart
    ]);

    const text = result.response.text();

    return res.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text
              }
            ]
          }
        }
      ],
      model: modelName
    });
  } catch (error) {
    console.error('Gemini analysis error:', error);

    return res.status(502).json({
      error: {
        message: error.message || 'Gemini analysis failed.'
      }
    });
  }
}

app.post('/api/gemini/analyze', analyzeWithGemini);

// إبقاء المسار القديم يعمل أيضًا
app.post('/api/analyze-blueprint', analyzeWithGemini);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Q-CRAFT Backend running on port ${PORT}`);
});



