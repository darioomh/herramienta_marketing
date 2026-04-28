import React, { useState } from 'react';
import { Search, Globe, CheckCircle2, XCircle, ShieldCheck, ArrowRight, Loader2, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';

interface AuditData {
  ssl: boolean;
  has_title: boolean;
  has_gtm: boolean;
  has_fb_pixel: boolean;
  status_code: number;
}

export default function AuditModule() {
  const { user } = useAuth();
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

      if (user) {
        await addDoc(collection(db, 'history'), {
          userId: user.uid,
          type: 'audit',
          payload: { url: formattedUrl, ...data },
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el sitio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 bg-white flex flex-col h-full">
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                <Globe size={18} strokeWidth={2} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none">Audit Protocol</h3>
                <p className="tech-label mt-1">Technical Health Scanner</p>
            </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <input
            type="text"
            placeholder="Dominio raíz (ej. apple.com)"
            className="input-field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runAudit()}
          />
        </div>
        <button
          onClick={runAudit}
          disabled={loading || !url}
          className="btn-primary"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-white/50" />
          ) : (
            <>
              <ShieldCheck size={18} /> Iniciar Auditoría
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-100 mb-6"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-tight">Access Error</h4>
                <p className="font-medium text-[11px] leading-snug">{error}</p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4"
            >
              <AuditItem label="SSL Certificate" status={result.ssl} />
              <AuditItem label="Structure Tags" status={result.has_title} />
              <AuditItem label="Event Tracking" status={result.has_gtm} />
              <AuditItem label="Conversion Pixel" status={result.has_fb_pixel} />

              <div className="sm:col-span-2 p-6 bg-slate-900 rounded-xl text-white overflow-hidden relative group mt-2">
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-emerald-400" />
                        <p className="tech-label !text-slate-400">STRATEGIC INSIGHT</p>
                    </div>
                    <h4 className="text-xl font-bold mb-2 tracking-tight">Optimization Report</h4>
                    <p className="text-slate-300 font-medium text-sm leading-relaxed">
                        {!result.has_fb_pixel ?
                            "Detectamos ausencia de rastreo avanzado. Implementar un pixel de conversión te permitirá medir y optimizar campañas con datos reales." :
                            "Configuración básica detectada. Recomendamos escalar el tracking a eventos de comportamiento para mejorar la precisión del modelo."
                        }
                    </p>
                  </div>
                  <button className="px-6 py-2 bg-emerald-500 text-slate-900 rounded-lg font-bold uppercase tracking-wider text-[10px] hover:bg-emerald-400 transition-all">
                    Upgrade Assets
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {!result && !loading && !error && (
             <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-300 py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                <Globe size={48} strokeWidth={1} className="mb-4 opacity-10" />
                <p className="tech-label opacity-40">Scanning Protocol Offline</p>
             </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AuditItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className={`flex justify-between items-center p-6 rounded-xl border transition-all duration-300 ${status ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
      <div className="min-w-0">
        <p className={`tech-label mb-1 ${status ? 'text-emerald-600' : 'text-slate-400'}`}>{status ? 'VERIFIED' : 'CRITICAL'}</p>
        <span className="text-sm font-bold text-slate-900 truncate block">{label}</span>
      </div>
      {status ? (
        <CheckCircle2 size={18} className="text-emerald-500" />
      ) : (
        <XCircle size={18} className="text-slate-300" />
      )}
    </div>
  );
}
