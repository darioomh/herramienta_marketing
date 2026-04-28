import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { LayoutDashboard, Zap, Activity, Database, Clock, ArrowUpRight, ShieldCheck, Search, Star, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryItem {
  id: string;
  type: 'creative' | 'lead' | 'audit' | 'roi';
  payload: any;
  createdAt: any;
}

export default function DashboardModule() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({ auditing: 0, creatives: 0, leads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const qAudits = query(collection(db, 'history'), where('userId', '==', user.uid), where('type', '==', 'audit'));
      const qCreatives = query(collection(db, 'history'), where('userId', '==', user.uid), where('type', '==', 'creative'));
      const qLeads = query(collection(db, 'history'), where('userId', '==', user.uid), where('type', '==', 'lead'));

      const [sAudits, sCreatives, sLeads] = await Promise.all([
        getCountFromServer(qAudits),
        getCountFromServer(qCreatives),
        getCountFromServer(qLeads)
      ]);

      setStats({
        auditing: sAudits.data().count,
        creatives: sCreatives.data().count,
        leads: sLeads.data().count
      });
    };

    fetchStats();

    const q = query(
      collection(db, 'history'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryItem));
      setHistory(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<ShieldCheck size={18} />} 
          title="Auditorías" 
          value={stats.auditing} 
          subtitle="Sitios diagnosticados"
        />
        <StatCard 
          icon={<Zap size={18} />} 
          title="Creativos" 
          value={stats.creatives} 
          subtitle="Identidades forjadas"
        />
        <StatCard 
          icon={<Database size={18} />} 
          title="Leads B2B" 
          value={stats.leads} 
          subtitle="Contactos extraídos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 card p-8 bg-white">
          <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Actividad <span className="text-slate-400 font-medium">Reciente</span></h3>
              <p className="tech-label mt-1">Live Operation Log</p>
            </div>
            <Clock size={16} className="text-slate-300" />
          </header>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {history.length > 0 ? (
                history.map((item, idx) => (
                  <motion.div
                    key={`${item.id}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:border-slate-400 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 leading-none mb-1">
                            {item.type === 'audit' && 'Auditoría Web'}
                            {item.type === 'creative' && 'Generación Marca'}
                            {item.type === 'lead' && 'Extracción Leads'}
                            {item.type === 'roi' && 'Forecast ROI'}
                        </h4>
                        <p className="tech-label !lowercase !tracking-tight opacity-60 truncate max-w-[150px] sm:max-w-xs">
                          {item.type === 'audit' && item.payload.url}
                          {item.type === 'creative' && item.payload.product}
                          {item.type === 'lead' && (item.payload.sector || item.payload.domain)}
                          {item.type === 'roi' && `Presupuesto $${item.payload.budget} · ROI ${item.payload.expected_roi_ratio}x`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {item.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-900" />
                    </div>
                  </motion.div>
                ))
              ) : !loading && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg">
                   <Search size={32} className="mb-4 opacity-10" />
                   <p className="tech-label opacity-40">Tus acciones aparecerán aquí</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
           <div className="card p-8 bg-slate-900 text-white relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Star size={16} className="text-emerald-400" />
                    <p className="tech-label !text-slate-400">AI STRATEGY</p>
                </div>
                <h4 className="text-xl font-bold leading-tight mb-2">Informe Semanal</h4>
                <p className="text-sm text-slate-300 font-medium mb-6">
                  Según tus últimas campañas, el sector SaaS Tech tiene un ROI incrementado del +14%.
                </p>
                <button className="w-full py-3 bg-white text-slate-900 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                  Ver Análisis Completos
                </button>
             </div>
           </div>

           <div className="card p-8 bg-white">
              <p className="tech-label mb-6">MARKET SENTIMENT</p>
              <div className="space-y-4">
                <SentimentRow label="SaaS Tech" value={84} />
                <SentimentRow label="E-commerce" value={62} />
                <SentimentRow label="Real Estate" value={45} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle }: any) {
    return (
        <div className="card p-6 bg-white flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center border border-slate-200">
                {icon}
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-900 leading-none mb-1">{value}</div>
                <div className="tech-label !text-slate-500">{title}</div>
            </div>
        </div>
    );
}

function SentimentRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono font-bold text-slate-900">{value}%</span>
      </div>
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-slate-900" 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'audit': return <ShieldCheck size={14} />;
        case 'creative': return <Zap size={14} />;
        case 'lead': return <Database size={14} />;
        case 'roi': return <TrendingUp size={14} />;
        default: return <Clock size={14} />;
    }
}

function getTypeColor(type: string) {
    switch (type) {
        case 'audit': return 'bg-slate-200 text-slate-900';
        case 'creative': return 'bg-slate-200 text-slate-900';
        case 'lead': return 'bg-slate-200 text-slate-900';
        case 'roi': return 'bg-slate-200 text-slate-900';
        default: return 'bg-slate-200 text-slate-500';
    }
}
