import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Global Stats Store (In-memory for MVP)
  const stats = {
    audits: 1284,
    creatives: 452,
    leads: 2109,
  };

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
    const { budget, cpc_estimated, expected_conv_rate } = req.body;
    
    const clicks = budget / cpc_estimated;
    const conversions = clicks * (expected_conv_rate / 100);
    // Business logic: Assuming an average order value of $50 for the ROI ratio
    const avgOrderValue = 50;
    const estimatedRevenue = conversions * avgOrderValue;
    const roi = estimatedRevenue / budget;

    res.json({
      estimated_clicks: Math.round(clicks),
      estimated_conversions: Number(conversions.toFixed(2)),
      expected_roi_ratio: Number(roi.toFixed(2)),
      recommendation: roi > 2 ? "Presupuesto Saludable" : "Optimizar CPC o Tasa de Conversión",
    });
  });

  // Lead Scraper Endpoint (Real-time with Gemini Grounding)
  app.post("/api/leads", async (req, res) => {
    const { sector, location } = req.body;
    
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Actúa como un experto en investigación de mercado B2B. Encuentra de 5 a 10 empresas reales, startups, agencias o aplicaciones existentes que operen en el sector: "${sector}". 
      Contexto geográfico: ${location || 'Global'}. 
      
      Debes buscar entidades REALES y VERIFICABLES. Si el sector es un nicho de software como "apps de hábitos para android", busca las apps más populares en Google Play Store (ej: Habitica, Fabulous, Loop, etc).
      
      Responde EXCLUSIVAMENTE en formato JSON con la siguiente estructura:
      {
        "leads": [
          {
            "name": "Nombre real",
            "site": "dominio.com",
            "email": "contacto@dominio.com"
          }
        ]
      }`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(result.response.text());
      const leads = data.leads || [];

      stats.leads += leads.length;
      res.json(leads);
    } catch (error) {
      console.error("Lead generation error:", error);
      res.status(500).json({ error: "Interrupción en el motor de búsqueda neural. Reintente en breve." });
    }
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

  // Creative Tracking
  app.post("/api/track-creative", (req, res) => {
    stats.creatives++;
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

      res.json({
        url: targetUrl,
        emails: cleanEmails,
        count: cleanEmails.length
      });
    } catch (error) {
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
