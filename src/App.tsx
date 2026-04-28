/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Rocket, Activity, Database, Menu, Bell, User, Zap, Search, LogOut } from 'lucide-react';
import AuditModule from './components/AuditModule';
import PredictorModule from './components/PredictorModule';
import CreativeModule from './components/CreativeModule';
import LeadsModule from './components/LeadsModule';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    audits: 1284,
    creatives: 452,
    leads: 2109,
    status: 'Activo'
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setGlobalStats({
        ...data,
        status: 'Activo'
      });
    } catch (e) {
      console.warn('Could not fetch real-time stats');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col items-center text-center py-20"
          >
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-200">
              <Rocket size={40} />
            </div>
            <h1 className="text-6xl font-extrabold tracking-tighter text-slate-900 mb-6 lg:text-7xl">
              El Cerebro de tu <span className="text-indigo-600">Marketing</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mb-16 font-medium leading-relaxed">
              MarketPulse AI unifica auditoría, generación de contenido, predicción de ROI y extracción de leads en una sola plataforma inteligente para equipos modernos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl px-4">
              <HomeCard 
                icon={<LayoutDashboard size={24} />} 
                title="Dashboard" 
                desc="Vista 360 de métricas y auditoría en tiempo real" 
                color="blue"
                onClick={() => setActiveTab('dashboard')} 
              />
              <HomeCard 
                icon={<Zap size={24} />} 
                title="Estudio" 
                desc="Identidad visual, logos y copys persuasivos" 
                color="purple"
                onClick={() => setActiveTab('creatives')} 
              />
              <HomeCard 
                icon={<Activity size={24} />} 
                title="ROI Prev" 
                desc="Simula escenarios y predice el retorno de inversión" 
                color="emerald"
                onClick={() => setActiveTab('analytics')} 
              />
              <HomeCard 
                icon={<Database size={24} />} 
                title="Leads" 
                desc="Extracción automatizada de prospectos B2B" 
                color="orange"
                onClick={() => setActiveTab('leads')} 
              />
            </div>
          </motion.div>
        );
      case 'dashboard':
        return (
          <div className="dashboard-grid">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <AuditModule />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <PredictorModule />
            </motion.div>
          </div>
        );
      case 'creatives':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto min-h-[600px]">
            <CreativeModule />
          </motion.div>
        );
      case 'analytics':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
            <PredictorModule />
          </motion.div>
        );
      case 'leads':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto min-h-[600px]">
            <LeadsModule />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FCFCFD]">
      {/* Top Navbar */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-xl transition-transform group-hover:scale-105">
            M
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900 hidden sm:inline">MarketPulse<span className="text-indigo-600">AI</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50">
          <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Rocket size={18} />} label="Inicio" />
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18} />} label="Resumen" />
          <NavItem active={activeTab === 'creatives'} onClick={() => setActiveTab('creatives')} icon={<Zap size={18} />} label="Estudio" />
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<Activity size={18} />} label="ROI" />
          <NavItem active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={<Database size={18} />} label="Leads" />
        </nav>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-3 relative">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-zinc-900 leading-none">{currentUser.displayName}</p>
                <p className="text-[10px] text-zinc-500">{currentUser.email}</p>
              </div>
              <div className="relative">
                <img 
                  src={currentUser.photoURL || ''} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-zinc-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  referrerPolicy="no-referrer"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                />
                
                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1">
                      <div className="px-4 py-2 border-b border-zinc-100 md:hidden">
                        <p className="text-xs font-bold text-zinc-900 truncate">{currentUser.displayName}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{currentUser.email}</p>
                      </div>
                      <button 
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={14} /> Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <User size={16} /> {authLoading ? '...' : 'Iniciar Sesión'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <div key={activeTab}>
            {activeTab !== 'home' && (
              <div className="mb-8">
                <motion.h1 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold tracking-tight mb-2 text-zinc-900"
                >
                  {activeTab === 'dashboard' ? 'Inteligencia de Mercado' : 
                   activeTab === 'creatives' ? 'Estudio Creativo' : 
                   activeTab === 'analytics' ? 'Previsión de ROI' : 
                   activeTab === 'leads' ? 'Extractor de Leads' : activeTab}
                </motion.h1>
                <p className="text-zinc-500 max-w-2xl text-sm">
                  {activeTab === 'dashboard' && "Visión general de tus métricas de marketing y capacidades de IA."}
                  {activeTab === 'creatives' && "Genera eslóganes, copys de anuncios y prompts visuales con Gemini AI."}
                  {activeTab === 'analytics' && "Modela el ROI de tu campaña antes de asignar presupuesto con nuestro motor inteligente."}
                  {activeTab === 'leads' && "Extrae leads B2B de alta calidad e información de contacto empresarial automáticamente."}
                </p>
              </div>
            )}

            {renderContent()}
          </div>
        </AnimatePresence>

        {activeTab !== 'home' && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white border border-zinc-100 rounded-xl shadow-sm">
            <SmallStat label="Consultas de Auditoría" value={globalStats.audits.toLocaleString()} />
            <SmallStat label="Creativos Generados" value={globalStats.creatives.toLocaleString()} />
            <SmallStat label="Leads Sincronizados" value={globalStats.leads.toLocaleString()} />
            <SmallStat label="Estado del Motor" value={globalStats.status} />
          </div>
        )}
      </main>

      {/* Mobile Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 h-16 flex items-center justify-around px-6 z-50">
        <MobileNavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Rocket size={20} />} />
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} />
        <MobileNavItem active={activeTab === 'creatives'} onClick={() => setActiveTab('creatives')} icon={<Zap size={20} />} />
        <MobileNavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<Activity size={20} />} />
        <MobileNavItem active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={<Database size={20} />} />
      </div>
    </div>
  );
}

function HomeCard({ icon, title, desc, color, onClick }: { icon: React.ReactNode, title: string, desc: string, color: string, onClick: () => void }) {
  const colorClasses = {
    blue: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white',
  }[color] || 'bg-slate-50 text-slate-600';

  return (
    <button 
      onClick={onClick}
      className="p-8 bg-white border border-slate-200 rounded-[2.5rem] hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 transition-all text-left flex flex-col items-start gap-6 group relative overflow-hidden"
    >
      <div className={`p-4 rounded-2xl transition-all duration-300 ${colorClasses} shadow-sm group-hover:shadow-indigo-200`}>
        {icon}
      </div>
      <div>
        <h3 className="font-display font-bold text-xl text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
        <Rocket size={20} className="text-indigo-200 rotate-45" />
      </div>
    </button>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${
        active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all ${
        active ? 'text-zinc-900 bg-zinc-100' : 'text-zinc-400'
      }`}
    >
      {icon}
    </button>
  );
}

function SmallStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="text-center">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">{label}</span>
      <span className="text-sm font-mono font-medium text-zinc-700">{value}</span>
    </div>
  );
}


