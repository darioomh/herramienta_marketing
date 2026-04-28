import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATS_FILE = path.join(process.cwd(), "data", "stats.json");

interface Stats {
  audits: number;
  creatives: number;
  leads: number;
}

function loadStats(): Stats {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const raw = fs.readFileSync(STATS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        audits: Number(parsed.audits) || 0,
        creatives: Number(parsed.creatives) || 0,
        leads: Number(parsed.leads) || 0,
      };
    }
  } catch (err) {
    console.warn("Could not load stats, starting from zero:", err);
  }
  return { audits: 0, creatives: 0, leads: 0 };
}

function saveStats(stats: Stats) {
  try {
    fs.mkdirSync(path.dirname(STATS_FILE), { recursive: true });
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (err) {
    console.warn("Could not persist stats:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Persistent global stats (data/stats.json)
  const stats: Stats = loadStats();

  // Site Audit Endpoint
  app.post("/api/audit", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "La URL es obligatoria" });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      const html = await response.text();
      const $ = cheerio.load(html);

      stats.audits++;
      saveStats(stats);

      const auditResults = {
        ssl: url.startsWith("https"),
        has_title: !!$("title").text(),
        has_gtm: html.toLowerCase().includes("googletagmanager"),
        has_fb_pixel: html.toLowerCase().includes("fbevents.js"),
        status_code: response.status,
      };

      res.json(auditResults);
    } catch (error) {
      console.error("Audit error:", error);
      res.status(500).json({ error: "Error al auditar el sitio. Asegúrate de que la URL sea accesible." });
    }
  });

  // ROI Prediction Endpoint
  app.post("/api/predict-roi", (req, res) => {
    const { budget, cpc_estimated, expected_conv_rate, avg_order_value } = req.body;

    const budgetNum = Number(budget);
    const cpcNum = Number(cpc_estimated);
    const convRateNum = Number(expected_conv_rate);
    const aovNum = Number(avg_order_value);

    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      return res.status(400).json({ error: "Presupuesto inválido (>0 requerido)." });
    }
    if (!Number.isFinite(cpcNum) || cpcNum <= 0) {
      return res.status(400).json({ error: "CPC inválido (>0 requerido)." });
    }
    if (!Number.isFinite(convRateNum) || convRateNum <= 0 || convRateNum > 100) {
      return res.status(400).json({ error: "Tasa de conversión inválida (0-100)." });
    }
    if (!Number.isFinite(aovNum) || aovNum <= 0) {
      return res.status(400).json({ error: "Valor medio de pedido (AOV) inválido (>0 requerido)." });
    }

    const clicks = budgetNum / cpcNum;
    const conversions = clicks * (convRateNum / 100);
    const estimatedRevenue = conversions * aovNum;
    const roi = estimatedRevenue / budgetNum;

    res.json({
      estimated_clicks: Math.round(clicks),
      estimated_conversions: Number(conversions.toFixed(2)),
      estimated_revenue: Number(estimatedRevenue.toFixed(2)),
      expected_roi_ratio: Number(roi.toFixed(2)),
      recommendation: roi > 2 ? "Presupuesto Saludable" : "Optimizar CPC o Tasa de Conversión",
    });
  });

  // Lead Scraper Endpoint (Real-time with Gemini Grounding)
  app.post("/api/leads", async (req, res) => {
    const { sector, location } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "El backend no tiene GEMINI_API_KEY configurada. Configúrala en Vercel y vuelve a desplegar.",
      });
    }

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

      const prompt = `Actúa como un experto en investigación de mercado B2B. Encuentra de 5 a 10 empresas reales, startups, agencias o aplicaciones existentes que operen en el sector: "${sector}".
      Contexto geográfico: ${location || 'Global'}.

      Debes buscar entidades REALES y VERIFICABLES usando Google Search. Si el sector es un nicho de software como "apps de hábitos para android", busca las apps más populares en Google Play Store (ej: Habitica, Fabulous, Loop, etc).

      Responde EXCLUSIVAMENTE en formato JSON con la siguiente estructura (sin texto adicional, sin markdown, sólo el JSON):
      [
        { "name": "Nombre real", "site": "dominio.com", "email": "contacto@dominio.com" }
      ]`;

      const generateWithModel = async (modelName: string) => {
        return await genAI.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
      };

      let result;
      try {
        result = await generateWithModel("gemini-2.5-flash");
      } catch (err) {
        console.warn("Primary model error, falling back to gemini-flash-latest:", err);
        result = await generateWithModel("gemini-flash-latest");
      }

      const text = result.text || "";
      // Anchor to `[{ ... }]` so we don't pick up citation brackets like [1], [2]
      // that Google Search grounding can sprinkle through the response.
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      const leads = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(502).json({ error: "Gemini no devolvió resultados utilizables. Reintenta con otro sector." });
      }

      stats.leads += leads.length;
      saveStats(stats);
      res.json(leads);
    } catch (error) {
      console.error("Lead generation error:", error);
      res.status(500).json({ error: "No se pudo obtener leads en este momento." });
    }
  });

  // Brand / Creative Generation Endpoint (server-side, never leak API key to client)
  app.post("/api/creative", async (req, res) => {
    const { product } = req.body;
    if (!product || typeof product !== "string") {
      return res.status(400).json({ error: "El campo 'product' es obligatorio." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "El backend no tiene GEMINI_API_KEY configurada. Configúrala en Vercel y vuelve a desplegar.",
      });
    }

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

      const prompt = `Genera una IDENTIDAD DE MARCA COMPLETA para este producto en ESPAÑOL: ${product}.
      Devuelve EXCLUSIVAMENTE un JSON con la siguiente estructura:
      {
        "slogan": "eslogan corto",
        "newsletter_subject": "asunto atractivo",
        "newsletter_content": "cuerpo de la newsletter persuasivo y completo",
        "banner_prompt": "prompt para imagen de fondo",
        "ad_copy": "texto persuasivo corto",
        "logo_concept": "objeto único y simple (ej: 'una montaña abstracta')",
        "colors": ["#hex1", "#hex2", "#hex3"],
        "tone": "descriptivo (ej: Rebelde, Sofisticado)",
        "values": ["valor1", "valor2"],
        "audience": "público objetivo corto"
      }`;

      const generateWithModel = async (modelName: string) => {
        return await genAI.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                slogan: { type: Type.STRING },
                newsletter_subject: { type: Type.STRING },
                newsletter_content: { type: Type.STRING },
                banner_prompt: { type: Type.STRING },
                ad_copy: { type: Type.STRING },
                logo_concept: { type: Type.STRING },
                colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                tone: { type: Type.STRING },
                values: { type: Type.ARRAY, items: { type: Type.STRING } },
                audience: { type: Type.STRING },
              },
              required: [
                "slogan",
                "newsletter_subject",
                "newsletter_content",
                "banner_prompt",
                "ad_copy",
                "logo_concept",
                "colors",
                "tone",
                "values",
                "audience",
              ],
            },
          },
        });
      };

      let result;
      try {
        result = await generateWithModel("gemini-2.5-flash");
      } catch (err) {
        console.warn("Creative primary model error, falling back to gemini-flash-latest:", err);
        result = await generateWithModel("gemini-flash-latest");
      }

      const data = JSON.parse(result.text || "{}");

      stats.creatives++;
      saveStats(stats);
      res.json(data);
    } catch (error) {
      console.error("Creative generation error:", error);
      res.status(500).json({ error: "No se pudo generar la identidad de marca en este momento." });
    }
  });

  // Logo Generation Endpoint
  app.post("/api/creative-logo", async (req, res) => {
    const { product, logo_concept } = req.body;
    if (!product || !logo_concept) {
      return res.status(400).json({ error: "Faltan 'product' o 'logo_concept'." });
    }

    const promptText = `Professional logo, minimalist icon for a brand called ${product}, ${logo_concept}, flat vector, creative design, high quality, white background, masterpiece`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
        const result = await genAI.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: promptText,
          config: { numberOfImages: 1, aspectRatio: "1:1" },
        });
        const img = result.generatedImages?.[0]?.image;
        if (img?.imageBytes) {
          return res.json({ logoUrl: `data:image/png;base64,${img.imageBytes}` });
        }
      } catch (err) {
        console.warn("Imagen generation failed, falling back to Pollinations:", err);
      }
    }

    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://pollinations.ai/p/${encodeURIComponent(promptText)}?width=512&height=512&nologo=true&seed=${seed}&model=flux`;
    res.json({ logoUrl: url });
  });

  // Stats Endpoint
  app.get("/api/stats", (req, res) => {
    res.json(stats);
  });

  // MCP Context Endpoint
  app.get("/api/mcp/context", (req, res) => {
    res.json({
      agent_name: "MarketPulse_Architect",
      description: "Agente experto en auditoría y generación de leads",
      tools: ["site_audit", "lead_scraper", "roi_predictor"]
    });
  });

  // Creative Tracking (legacy)
  app.post("/api/track-creative", (req, res) => {
    stats.creatives++;
    saveStats(stats);
    res.json({ success: true });
  });

  // Domain Email Scraper Endpoint
  app.post("/api/scrape-emails", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL requerida" });

    try {
      const targetUrl = url.startsWith("http") ? url : `https://${url}`;
      const response = await fetch(targetUrl);
      const html = await response.text();

      // Regex para encontrar emails en el HTML
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = html.match(emailRegex) || [];

      // Limpiar y quitar duplicados
      const cleanEmails = [...new Set(foundEmails)].filter(email => {
        // Filtros básicos para evitar ruido común (extensiones de archivos)
        const lower = email.toLowerCase();
        return !lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.gif') && !lower.endsWith('.svg');
      });

      stats.leads += cleanEmails.length;
      saveStats(stats);

      res.json({
        url: targetUrl,
        emails: cleanEmails,
        count: cleanEmails.length
      });
    } catch (error) {
      console.error("Email scrape error:", error);
      res.status(500).json({ error: "No se pudo escanear el sitio." });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
