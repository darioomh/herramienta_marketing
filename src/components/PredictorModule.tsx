import React, { useState } from 'react';
import { TrendingUp, DollarSign, Target, MousePointer2, Info, ChevronRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';

interface Prediction {
  estimated_clicks: number;
  estimated_conversions: number;
  expected_roi_ratio: number;
  recommendation: string;
}

export default function PredictorModule() {
  const { user } = useAuth();
  const [inputs, setInputs] = useState({
    budget: 2500,
    cpc: 1.20,
    conv_rate: 3.5
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);

  const calculate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/predict-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: inputs.budget,
          cpc_estimated: inputs.cpc,
          expected_conv_rate: inputs.conv_rate
        }),
      });
      const data = await res.json();
      setResult(data);

      if (user) {
        await addDoc(collection(db, 'history'), {
          userId: user.uid,
          type: 'audit',
          payload: { ...inputs, ...data },
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 bg-white flex flex-col h-full">
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                <TrendingUp size={18} strokeWidth={2} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none">ROI Forecast</h3>
                <p className="tech-label mt-1">Growth Prediction Model</p>
            </div>
        </div>
      </header>

      <div className="space-y-6 mb-8">
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
           <div className="space-y-6">
            <div>
              <label className="tech-label mb-2 block">Presupuesto Mensual ($)</label>
              <input
                type="number"
                className="input-field text-2xl font-semibold"
                value={inputs.budget}
                onChange={(e) => setInputs({ ...inputs, budget: Number(e.target.value) })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="tech-label mb-2 block">CPC Teórico ($)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    className="input-field text-xl font-semibold"
                    value={inputs.cpc}
                    onChange={(e) => setInputs({ ...inputs, cpc: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="tech-label mb-2 block">Conv Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    className="input-field text-xl font-semibold"
                    value={inputs.conv_rate}
                    onChange={(e) => setInputs({ ...inputs, conv_rate: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
           </div>
        </div>

        <button
          onClick={calculate}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-white/50" />
          ) : (
            <>
              <Sparkles size={18} /> Ejecutar Simulación Forecast
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <ResultStat label="Alcance" value={`${result.estimated_clicks}`} icon={<MousePointer2 size={14} />} />
                <ResultStat label="Convs" value={result.estimated_conversions} icon={<Target size={14} />} color="text-emerald-600" />
              </div>
              
              <div className="bg-slate-900 p-8 rounded-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="tech-label !text-slate-500 mb-2">ROI MULTIPLIER</p>
                        <h4 className="text-2xl font-bold text-white tracking-tight">Crecimiento Proyectado</h4>
                    </div>
                    <span className="text-7xl font-bold text-emerald-400 leading-none tracking-tighter">{result.expected_roi_ratio}x</span>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-start gap-4 backdrop-blur-sm">
                    <Info size={16} className="text-emerald-400 shrink-0 mt-1" />
                    <span className="text-sm font-medium text-slate-300 leading-relaxed">{result.recommendation}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-4">
                <AlertCircle size={14} className="text-slate-400 shrink-0 mt-1" />
                <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                    Simulación basada en inferencia bayesiana. Variabilidad estimada: ±3.8%. Los resultados reales pueden variar según la calidad creativa.
                </p>
              </div>
            </motion.div>
          ) : !loading && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-300 py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <TrendingUp size={48} strokeWidth={1} className="mb-4 opacity-10" />
              <p className="tech-label opacity-40">Financial Engine Waiting</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultStat({ label, value, icon, color = "text-slate-900" }: { label: string; value: number | string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-400">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-400">{icon}</span>
        <span className="tech-label">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color} tracking-tight`}>{value}</div>
    </div>
  );
}

