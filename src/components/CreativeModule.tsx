import React, { useState } from 'react';
import { Sparkles, Copy, Mail, Layout, Zap, Loader2, Wand2, Rocket, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';

interface CreativeBundle {
  slogan: string;
  newsletter_subject: string;
  newsletter_content: string;
  banner_prompt: string;
  ad_copy: string;
  logo_concept: string;
  colors: string[];
  tone: string;
  values: string[];
  audience: string;
}

export default function CreativeModule() {
  const { user } = useAuth();
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [bundle, setBundle] = useState<CreativeBundle | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateCreative = async () => {
    if (!product) return;
    setLoading(true);
    setError(null);
    setLogoUrl(null);
    setBundle(null);
    try {
      const response = await fetch('/api/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Error ${response.status} al generar la marca.`);
      }
      const data: CreativeBundle = await response.json();
      setBundle(data);
      setLoading(false);

      if (user) {
        try {
          await addDoc(collection(db, 'history'), {
            userId: user.uid,
            type: 'creative',
            payload: { product, ...data },
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.warn("Failed to log history", e);
        }
      }

      setLogoLoading(true);
      try {
        const logoRes = await fetch('/api/creative-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product, logo_concept: data.logo_concept }),
        });
        if (logoRes.ok) {
          const logoData = await logoRes.json();
          setLogoUrl(logoData.logoUrl);
        }
      } catch (logoErr) {
        console.warn("Logo generation failed", logoErr);
      } finally {
        setLogoLoading(false);
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || 'Error de red al generar la marca.');
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 bg-white flex flex-col h-full">
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                <Sparkles size={18} strokeWidth={2} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none">Brand Identity</h3>
                <p className="tech-label mt-1">Creative DNA Engine</p>
            </div>
        </div>
      </header>

      <div className="space-y-4 mb-8">
        <div className="relative group">
          <textarea
            placeholder="Describe tu visión... (ej: Una agencia de diseño web que usa IA)"
            className="input-field h-32 resize-none text-base"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </div>
        <button
          onClick={generateCreative}
          disabled={loading || !product}
          className="btn-primary w-full"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-white/50" />
          ) : (
            <>
              <Wand2 size={18} /> Iniciar Generación de Marca
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-100 mb-6"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-tight">Generation Error</h4>
              <p className="font-medium text-[11px] leading-snug">{error}</p>
            </div>
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          {bundle ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pb-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl flex flex-col items-center justify-center min-h-[300px]">
                  <p className="tech-label mb-6">Logo Concept v1.0</p>
                  <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm relative group">
                    {logoLoading ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                      </div>
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    ) : (
                      <Rocket size={48} className="text-slate-200" />
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl">
                  <p className="tech-label mb-6">Palette System</p>
                  <div className="space-y-3">
                    {bundle.colors.map((color, idx) => (
                        <div key={`${color}-${idx}`} className="flex items-center gap-4 bg-white p-2.5 rounded-lg border border-slate-200 group/color">
                            <div className="w-10 h-10 rounded border border-slate-900/10 shadow-sm" style={{ backgroundColor: color }} />
                            <div className="flex flex-col flex-1">
                              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase leading-none mb-1">Hex</span>
                              <span className="text-sm font-mono font-bold text-slate-900 uppercase">{color}</span>
                            </div>
                            <button 
                                onClick={() => navigator.clipboard.writeText(color)}
                                className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <BrandAttr title="Tono" value={bundle.tone} />
                <BrandAttr title="Audiencia" value={bundle.audience} />
                <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <p className="tech-label mb-4">Core Values</p>
                   <div className="flex flex-wrap gap-2">
                        {bundle.values.map((v, idx) => (
                            <span key={`${v}-${idx}`} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider">{v}</span>
                        ))}
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <ResultItem icon={<Zap size={16} />} title="Slogan" content={bundle.slogan} />
                <ResultItem icon={<Layout size={16} />} title="Ad Copy" content={bundle.ad_copy} />
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 relative group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-xs">NL</div>
                            <p className="tech-label">Newsletter Content</p>
                        </div>
                        <button 
                            onClick={() => navigator.clipboard.writeText(bundle.newsletter_content)}
                            className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                        >
                            <Copy size={18} />
                        </button>
                    </div>
                    <div className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap font-sans bg-white p-6 rounded-lg border border-slate-200">
                        {bundle.newsletter_content}
                    </div>
                </div>
              </div>
            </motion.div>
          ) : (
            !loading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-300 py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                <Sparkles size={48} strokeWidth={1} className="mb-4 opacity-10" />
                <p className="tech-label opacity-40">Ready for generation</p>
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="tech-label mb-2">{title}</p>
            <p className="text-sm font-bold text-slate-900 uppercase truncate tracking-tight">{value}</p>
        </div>
    )
}

function ResultItem({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
  return (
    <div className="group relative p-6 border border-slate-200 rounded-xl bg-white hover:border-slate-400 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
            <span className="text-slate-400">{icon}</span>
            <p className="tech-label">{title}</p>
        </div>
        <button 
            onClick={() => navigator.clipboard.writeText(content)}
            className="text-slate-300 hover:text-slate-900 transition-colors"
        >
            <Copy size={16} />
        </button>
      </div>
      <p className="text-base text-slate-900 font-medium leading-relaxed truncate">{content}</p>
    </div>
  );
}
