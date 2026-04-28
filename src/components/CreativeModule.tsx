import React, { useState } from 'react';
import { Sparkles, Copy, Mail, Layout, Zap, Loader2, Wand2, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

interface CreativeBundle {
  slogan: string;
  newsletter_subject: string;
  banner_prompt: string;
  ad_copy: string;
  logo_concept: string;
  colors: string[];
  tone: string;
  values: string[];
  audience: string;
}

export default function CreativeModule() {
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [bundle, setBundle] = useState<CreativeBundle | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const generate = async () => {
    if (!product) return;
    setLoading(true);
    setLogoUrl(null);
    setBundle(null);
    try {
      const generateWithModel = async (modelName: string) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: `Genera una IDENTIDAD DE MARCA COMPLETA para este producto en ESPAÑOL: ${product}. 
          Responde EXCLUSIVAMENTE en formato JSON con la siguiente estructura:
          {
            "slogan": "eslogan corto",
            "newsletter_subject": "asunto atractivo",
            "banner_prompt": "prompt para imagen de fondo",
            "ad_copy": "texto persuasivo corto",
            "logo_concept": "objeto único y simple (ej: 'una montaña abstracta')",
            "colors": ["#hex1", "#hex2", "#hex3"],
            "tone": "descriptivo (ej: Rebelde, Sofisticado)",
            "values": ["valor1", "valor2"],
            "audience": "público objetivo corto"
          }
          Importante: Usa un tono profesional y creativo.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                slogan: { type: Type.STRING },
                newsletter_subject: { type: Type.STRING },
                banner_prompt: { type: Type.STRING },
                ad_copy: { type: Type.STRING },
                logo_concept: { type: Type.STRING },
                colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                tone: { type: Type.STRING },
                values: { type: Type.ARRAY, items: { type: Type.STRING } },
                audience: { type: Type.STRING },
              },
              required: ["slogan", "newsletter_subject", "banner_prompt", "ad_copy", "logo_concept", "colors", "tone", "values", "audience"],
            },
          },
        });
      };

      let response;
      try {
        response = await generateWithModel("gemini-3-flash-preview");
      } catch (err: any) {
        console.warn("Retrying with fallback...");
        response = await generateWithModel("gemini-flash-latest");
      }

      const data = JSON.parse(response.text);
      setBundle(data);
      setLoading(false); // Text is ready

      // Start image generation separately
      setLogoLoading(true);
      try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: `Professional minimalist logo icon for a brand called ${product}. Vision: ${data.logo_concept}. Style: Flat vector, high quality, white background, masterpiece, professional design.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            },
          },
        });

        const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart?.inlineData?.data) {
          setLogoUrl(`data:image/png;base64,${imagePart.inlineData.data}`);
        } else {
          throw new Error("No image data");
        }
      } catch (imgErr) {
        console.warn("Gemini image generation failure, using Pollinations fallback:", imgErr);
        const seed = Math.floor(Math.random() * 1000000);
        const cleanLogoPrompt = encodeURIComponent(`Professional logo, minimalist icon for a brand called ${product}, ${data.logo_concept}, flat vector, creative design, high quality, white background, masterpiece`);
        setLogoUrl(`https://pollinations.ai/p/${cleanLogoPrompt}?width=512&height=512&nologo=true&seed=${seed}&model=flux`);
      } finally {
        setLogoLoading(false);
      }

      fetch('/api/track-creative', { method: 'POST' });
    } catch (error: any) {
      console.error("Generation error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 h-full flex flex-col bg-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
          <Sparkles size={24} />
        </div>
        <div>
          <h3 className="font-display font-bold text-2xl text-slate-900 leading-tight">Brand Studio <span className="text-indigo-600">Pro</span></h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Generación de Identidad con Gemini AI</p>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        <div className="relative group">
          <textarea
            placeholder="¿Qué quieres crear? (ej: Cafetería minimalista para nómadas digitales)"
            className="w-full px-6 py-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all text-sm h-32 resize-none shadow-sm placeholder:text-slate-400 group-hover:border-slate-200"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
          <div className="absolute top-4 right-6 text-slate-300">
            <Layout size={18} />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || !product}
          className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95"
        >
          {loading ? (
            <Loader2 size={24} className="animate-spin text-white/80" />
          ) : (
            <>
              <Wand2 size={22} /> Construir ADN de Marca
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          {bundle ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Logo y Colores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center min-h-[220px] justify-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Propuesta Visual</span>
                  <div className="w-36 h-36 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 relative shadow-sm group-hover:scale-105 transition-transform">
                    {logoLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                        <span className="text-[8px] font-bold text-slate-400">PINTANDO...</span>
                      </div>
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-slate-200"><Rocket size={40} /></div>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Cromática de Marca</span>
                  <div className="flex gap-3 h-full flex-col">
                    {bundle.colors.map(color => (
                        <div key={color} className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-100">
                            <div className="w-12 h-12 rounded-lg shadow-sm border border-black/5" style={{ backgroundColor: color }} />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">HEX</span>
                              <span className="text-xs font-mono font-bold text-slate-900">{color}</span>
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Atributos */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <BrandAttr title="Marca" value={bundle.tone} />
                <BrandAttr title="Core" value={bundle.audience} />
                <div className="col-span-2 bg-white px-6 py-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Valores Fundamentales</span>
                   <div className="flex flex-wrap gap-2">
                        {bundle.values.map(v => (
                            <span key={v} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold tracking-tight">{v}</span>
                        ))}
                   </div>
                </div>
              </div>

              {/* Mensajería */}
              <div className="space-y-4 pt-2">
                <ResultItem icon={<Zap size={14} />} title="Eslogan Principal" content={bundle.slogan} />
                <ResultItem icon={<Layout size={14} />} title="Copy Publicitario" content={bundle.ad_copy} />
                <ResultItem icon={<Mail size={14} />} title="Asunto Newsletter" content={bundle.newsletter_subject} />
              </div>
            </motion.div>
          ) : (
            !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <Rocket size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold">Define tu producto para empezar</p>
                <p className="text-[10px] font-medium opacity-60">IA generará tu universo de marca</p>
              </div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BrandAttr({ title, value }: { title: string; value: string }) {
    return (
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{title}</span>
            <span className="text-[11px] font-bold text-slate-900 block truncate">{value}</span>
        </div>
    )
}

function ResultItem({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="group relative p-3 border border-zinc-100 rounded-lg bg-zinc-50/30 hover:bg-white transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-purple-600">{icon}</span>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-sm text-zinc-800 leading-relaxed pr-8">{content}</p>
      <button 
        onClick={copyToClipboard}
        className="absolute right-2 top-2 p-1.5 text-zinc-400 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Copy size={14} />
      </button>
    </div>
  );
}
