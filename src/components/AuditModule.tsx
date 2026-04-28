import React, { useState } from 'react';
import { Search, Globe, CheckCircle2, XCircle, ShieldCheck, ArrowRight, Loader2, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditData {
  ssl: boolean;
  has_title: boolean;
  has_gtm: boolean;
  has_fb_pixel: boolean;
  status_code: number;
}

export default function AuditModule() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el sitio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 bg-white border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
          <Globe size={24} />
        </div>
        <div>
          <h3 className="font-display font-bold text-2xl text-slate-900 leading-tight">Diagnostic <span className="text-indigo-600">Engine</span></h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auditoría Técnica en Tiempo Real</p>
        </div>
      </div>

      <div className="flex gap-3 mb-10">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Introduce el dominio (ej. apple.com)"
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-200 transition-all font-mono text-sm tracking-tight placeholder:text-slate-400"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runAudit()}
          />
        </div>
        <button
          onClick={runAudit}
          disabled={loading || !url}
          className="px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95"
        >
          {loading ? (
            <Loader2 size={24} className="animate-spin text-white/80" />
          ) : (
            <>
              <ShieldCheck size={20} /> Analizar
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-5 bg-red-50 text-red-700 rounded-2xl flex items-start gap-4 text-sm mb-6 border border-red-100"
            >
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuditItem label="SSL Certificate" status={result.ssl} />
                <AuditItem label="Title Tags" status={result.has_title} />
                <AuditItem label="Google Tags" status={result.has_gtm} />
                <AuditItem label="Target Pixels" status={result.has_fb_pixel} />
              </div>

              {!result.has_fb_pixel && (
                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex gap-4">
                  <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm h-fit">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1 leading-none uppercase tracking-tight">Oportunidad Estratégica</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Tu sitio no trackea conversiones. Implementar píxeles ahora podría aumentar tu ROAS en un <span className="font-bold text-indigo-600">32%</span>.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!result && !loading && !error && (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 py-16 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                <Globe size={48} className="mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-60">Listo para escanear</p>
                <p className="text-[10px] font-medium opacity-40 mt-1">El servidor está en espera de peticiones</p>
             </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AuditItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className={`flex justify-between items-center px-6 py-4 rounded-2xl border transition-all ${status ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-50 opacity-60'}`}>
      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{label}</span>
      {status ? (
        <CheckCircle2 size={24} className="text-emerald-500" />
      ) : (
        <XCircle size={24} className="text-slate-300" />
      )}
    </div>
  );
}
