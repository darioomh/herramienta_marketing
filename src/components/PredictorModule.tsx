import React, { useState } from 'react';
import { TrendingUp, DollarSign, Target, MousePointer2, Info, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Prediction {
  estimated_clicks: number;
  estimated_conversions: number;
  expected_roi_ratio: number;
  recommendation: string;
}

export default function PredictorModule() {
  const [inputs, setInputs] = useState({
    budget: 1000,
    cpc: 0.85,
    conv_rate: 2.5
  });
  const [result, setResult] = useState<Prediction | null>(null);

  const calculate = async () => {
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
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <TrendingUp size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Motor de Previsión de ROI</h3>
          <p className="text-sm text-zinc-500">Pronostica el rendimiento de tu campaña.</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Presupuesto Mensual ($)</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
            value={inputs.budget}
            onChange={(e) => setInputs({ ...inputs, budget: Number(e.target.value) })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">CPC Est. ($)</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              value={inputs.cpc}
              onChange={(e) => setInputs({ ...inputs, cpc: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Tasa Conv. (%)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              value={inputs.conv_rate}
              onChange={(e) => setInputs({ ...inputs, conv_rate: Number(e.target.value) })}
            />
          </div>
        </div>
        <button
          onClick={calculate}
          className="w-full btn-primary !bg-emerald-600 hover:!bg-emerald-700 mt-2"
        >
          Generar Pronóstico
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-zinc-900 text-white rounded-xl space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <StatBlock label="Clicks Est." value={result.estimated_clicks} icon={<MousePointer2 size={14} />} />
            <StatBlock label="Convs Est." value={result.estimated_conversions} icon={<Target size={14} />} />
          </div>
          
          <div className="pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">ROI Esperado</span>
              <span className="text-2xl font-mono font-bold text-emerald-400">{result.expected_roi_ratio}x</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Info size={12} />
              <span>{result.recommendation}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatBlock({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 mb-1">
        {icon} {label}
      </span>
      <div className="text-lg font-mono font-bold">{value}</div>
    </div>
  );
}
