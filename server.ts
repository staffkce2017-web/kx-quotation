import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // API Route for Quotation Translation via Gemini
  app.post('/api/translate-quotation', async (req, res) => {
    try {
      const { textPayload, targetLang = 'en' } = req.body;
      if (!textPayload) {
        return res.status(400).json({ error: 'Missing textPayload' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const prompt = `You are an expert bilingual legal and business translator for King Mongkut's University of Technology Thonburi (KMUTT) Knowledge Xchange (KX Building).
Translate the following Thai quotation fields into fluent, professional business English (or Thai if targetLang is 'th').

Rules:
1. Retain all numbers, IDs, dates, prices, quantities, and structure exactly.
2. Translate venue/room names naturally (e.g. "ห้องสัมมนา X11.2 ชั้น 11" -> "Seminar Room X11.2, 11th Floor").
3. Translate catering & equipment items accurately (e.g. "อาหารว่างและเครื่องดื่ม (Coffee Break)" -> "Coffee Break & Refreshments").
4. Translate customer details (Company name, Address with Road, Sub-district, District, Province, Postal Code, Contact Person).
5. Translate terms, conditions, overtime notes, and cancellation policies clearly.
6. Target language: ${targetLang === 'th' ? 'Thai' : 'English'}.

Input JSON payload:
${JSON.stringify(textPayload, null, 2)}

Respond with ONLY a valid JSON object matching the input structure, with translated strings. Do not include markdown code block syntax.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '{}';
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const clean = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        parsed = JSON.parse(clean);
      }

      return res.json({ success: true, translated: parsed });
    } catch (err: any) {
      console.error('Translation server error:', err);
      return res.status(500).json({ error: err.message || 'Translation failed' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
