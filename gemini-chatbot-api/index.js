import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();

// ==== setup __dirname untuk ESM ====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inisialisasi client Gemini dengan API key dari .env
const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY,
});

// Set default model Gemini
const GEMINI_MODEL = "gemini-2.5-flash";

// ===== Middleware umum =====
app.use(cors());
app.use(express.json());

// serve frontend dari folder public
app.use(express.static(path.join(__dirname, "public")));

// helper untuk ambil teks dari response Gemini
function extractText(response) {
  return (
    response.candidates
      ?.map((c) => c.content?.parts?.map((p) => p.text || "").join(""))
      .join("\n\n") || ""
  );
}

/* ================== 1. CHAT DENGAN CONVERSATION ================== */
app.post("/api/chat", async (req, res) => {
  const { conversation } = req.body;

  try {
    if (!Array.isArray(conversation)) {
      throw new Error("Conversation must be an array!");
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });

    const reply = extractText(result);

    res.status(200).json({ result: reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* ================== 2. GENERATE TEXT DARI PROMPT ================== */
app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = extractText(response);
    res.status(200).json({ result: text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

/* ========== 3. GENERATE TEKS BERDASARKAN GAMBAR (IMAGE-TO-TEXT) ========== */
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  const { prompt } = req.body;

  // ubah file gambar jadi base64
  const base64Image = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt || "Jelaskan isi gambar ini." },
            {
              inlineData: {
                data: base64Image,
                mimeType: req.file.mimetype,
              },
            },
          ],
        },
      ],
    });

    const text = extractText(response);
    res.status(200).json({ result: text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

/* ========== 4. GENERATE TEKS DARI DOKUMEN (PDF/DOCX/TXT DLL) ========== */
app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    const { prompt } = req.body;
    const base64Document = req.file.buffer.toString("base64");

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt || "Tolong buat ringkasan dari dokumen berikut.",
              },
              {
                inlineData: {
                  data: base64Document,
                  mimeType: req.file.mimetype,
                },
              },
            ],
          },
        ],
      });

      const text = extractText(response);
      res.status(200).json({ result: text });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message });
    }
  }
);

/* ========== 5. GENERATE TEKS DARI AUDIO (TRANSKRIP / ANALISIS) ========== */
app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const { prompt } = req.body;
  const base64Audio = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt || "Tolong buatkan transkrip dari rekaman berikut.",
            },
            {
              inlineData: {
                data: base64Audio,
                mimeType: req.file.mimetype,
              },
            },
          ],
        },
      ],
    });

    const text = extractText(response);
    res.status(200).json({ result: text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

// ===== Jalankan server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));
