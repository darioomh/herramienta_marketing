import React, { useState } from 'react';
import { 
  BarChart3, 
  Brain, 
  Database, 
  LayoutDashboard, 
  Megaphone, 
  LogOut,
  ChevronRight,
  Activity,
  Zap,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AuditModule from './components/AuditModule';
import CreativeModule from './components/CreativeModule';
import PredictorModule from './components/PredictorModule';
import LeadsModule from './components/LeadsModule';
import DashboardModule from './components/DashboardModule';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';

function AppContent() {
  const { user, loading, authError, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'creatives' | 'analytics' | 'leads'>('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans font-mono tracking-tighter">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-slate-900 flex items-center gap-4"
        >
          <Activity size={24} />
          <span>INITIALIZING_PROTOCOL...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full">
          <div className="text-center mb-12">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center mx-auto mb-6">
              <Zap size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">MarketPulse Pro</h1>
            <p className="tech-label">B2B Intelligence Terminal</p>
          </div>
          
          <div className="card p-8 border-slate-200">
            <button 
              onClick={login}
              className="btn-primary w-full h-12 font-bold uppercase tracking-wider"
            >
              Sign in with Google
            </button>
            {authError && (
              <div
                role="alert"
                className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {authError}
              </div>
            )}
            <div className="mt-6 text-center pt-6 border-t border-slate-100 flex justify-center gap-4">
              <span className="tech-label !text-slate-300">v5.0.2</span>
              <span className="tech-label !text-slate-300">SECURE_AUTH</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col sm:flex-row font-sans selection:bg-slate-900 selection:text-white">
      {/* Precision Sidebar */}
      <nav className="w-full sm:w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col p-6 sm:fixed sm:h-full z-50">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div className="hidden lg:block">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-none">MarketPulse</h2>
            <p className="tech-label !text-slate-400 mt-1 uppercase tracking-widest">Enterprise AI</p>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutDashboard size={16} />} label="Overview" />
          <div className="pt-6 pb-2 px-4">
            <span className="tech-label !text-slate-300">Protocolos</span>
          </div>
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity size={16} />} label="Operaciones" />
          <NavItem active={activeTab === 'creatives'} onClick={() => setActiveTab('creatives')} icon={<Megaphone size={16} />} label="Creative Lab" />
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<TrendingUp size={16} />} label="ROI Forecast" />
          <NavItem active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={<Database size={16} />} label="Lead Engine" />
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 px-2 py-3">
            <img src={user.photoURL || ''} alt="User" referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg border border-slate-200" />
            <div className="hidden lg:block min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate tracking-tight">{user.displayName}</p>
              <p className="tech-label !tracking-tight !text-slate-400">OPERADOR_ACTIVO</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full h-10 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center lg:justify-start lg:px-4 gap-3"
          >
            <LogOut size={14} />
            <span className="hidden lg:block text-[10px] font-bold uppercase tracking-widest">Desconectar</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 sm:ml-20 lg:ml-64 bg-slate-50/20">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 lg:p-12 max-w-7xl mx-auto"
            >
              <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200 pb-10">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="tech-label">SISTEMA_OPERATIVO • v5.0.2</span>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter text-slate-900 mb-2">
                    Panel de Control
                  </h1>
                  <p className="text-slate-500 font-medium text-lg">Terminal centralizada de inteligencia y automatización B2B.</p>
                </div>
                
                <div className="flex gap-4">
                   <div className="px-6 py-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <p className="tech-label mb-1">PROYECCIÓN_ROI</p>
                      <p className="text-2xl font-bold text-emerald-600">+12.4%</p>
                   </div>
                   <div className="px-6 py-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <p className="tech-label mb-1">LEADS_EXTRACTED</p>
                      <p className="text-2xl font-bold text-slate-900">4.8k</p>
                   </div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <ModuleItem 
                    title="Operaciones & Logs"
                    desc="Monitoreo de actividad y métricas de salud técnica."
                    icon={<Activity size={18} />}
                    onClick={() => setActiveTab('dashboard')}
                   />
                   <ModuleItem 
                    title="Creative Lab"
                    desc="Generador de identidades corporativas y Brand DNA."
                    icon={<Megaphone size={18} />}
                    onClick={() => setActiveTab('creatives')}
                   />
                   <ModuleItem 
                    title="ROI Forecast"
                    desc="Predicción de crecimiento basada en modelos bayesianos."
                    icon={<TrendingUp size={18} />}
                    onClick={() => setActiveTab('analytics')}
                   />
                   <ModuleItem 
                    title="Lead Engine"
                    desc="Extracción automatizada de prospectos y scraping B2B."
                    icon={<Database size={18} />}
                    onClick={() => setActiveTab('leads')}
                   />
                </div>

                <div className="card p-8 bg-white border-slate-200 flex flex-col h-fit sticky top-8">
                  <header className="flex justify-between items-center mb-6">
                    <h3 className="tech-label">SYSTEM_LOGS</h3>
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  </header>
                  <div className="space-y-6">
                     <ActivityItem title="Auditoría OK" time="2m ago" icon={<Activity size={12} />} />
                     <ActivityItem title="Leads Sync" time="15m ago" icon={<Database size={12} />} />
                     <ActivityItem title="Brand Generated" time="1h ago" icon={<Megaphone size={12} />} />
                  </div>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="mt-8 pt-6 border-t border-slate-100 w-full text-center tech-label hover:text-slate-900 transition-colors"
                  >
                    View Full Console
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab !== 'home' && (
             <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 10 }}
              className="p-8 lg:p-12 max-w-7xl mx-auto"
             >
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                  >
                    <ChevronRight size={18} className="rotate-180" />
                  </button>
                  <h1 className="text-2xl font-bold tracking-tight uppercase">
                    {activeTab === 'dashboard' && 'Protocolos de Diagnóstico'}
                    {activeTab === 'creatives' && 'Ingeniería de Marca'}
                    {activeTab === 'analytics' && 'Previsión Financiera'}
                    {activeTab === 'leads' && 'Extracción de Datos'}
                  </h1>
                </div>

                <div className="space-y-6">
                  {activeTab === 'dashboard' && (
                    <>
                      <DashboardModule />
                      <AuditModule />
                    </>
                  )}
                  {activeTab === 'creatives' && <CreativeModule />}
                  {activeTab === 'analytics' && <PredictorModule />}
                  {activeTab === 'leads' && <LeadsModule />}
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Menu */}
      {activeTab !== 'home' && (
        <button 
          onClick={() => setActiveTab('home')}
          className="fixed bottom-8 right-8 w-12 h-12 bg-slate-900 text-white rounded-lg shadow-xl flex items-center justify-center hover:bg-black transition-all hover:scale-110 active:scale-95 z-50 border border-white/10"
        >
          <Brain size={18} />
        </button>
      )}
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
        active 
          ? 'bg-slate-900 text-white font-bold' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="hidden lg:block text-xs font-bold uppercase tracking-widest truncate">{label}</span>
    </button>
  );
}

function ModuleItem({ title, desc, icon, onClick }: { title: string, desc: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-8 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-900 transition-all group flex flex-col h-full"
    >
      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-6 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2 truncate w-full tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">{desc}</p>
      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="tech-label !text-slate-300 group-hover:!text-slate-900 transition-colors">ACCESS_TERMINAL</span>
        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 group-hover:text-slate-900 transition-all" />
      </div>
    </button>
  );
}

function ActivityItem({ title, time, icon }: { title: string, time: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
        <span className="text-slate-400">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1">{title}</p>
        <p className="tech-label !tracking-tight !text-slate-400">{time}</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
