import React, { useState } from 'react';
import { Database, Search, MapPin, Building2, ExternalLink, Mail, Loader2, Download, Rocket, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';

interface Lead {
  name: string;
  site: string;
  email: string;
}

export default function LeadsModule() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'sector' | 'domain'>('sector');
  const [sector, setSector] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scrapedEmails, setScrapedEmails] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-5));
  };

  const fetchLeads = async () => {
    if (!sector) return;
    setLoading(true);
    setLeads([]);
    setLogs(["Iniciando motor de búsqueda neural...", "Escaneando registros B2B..."]);
    
    try {
      addLog(`Buscando prospectos en sector: ${sector}`);
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector, location: 'Global' }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        addLog(`Éxito: ${data.length} entidades encontradas.`);
        setLeads(data);
        if (user) {
          await addDoc(collection(db, 'history'), {
            userId: user.uid,
            type: 'lead',
            payload: { sector, leads: data },
            createdAt: serverTimestamp(),
          });
        }
      } else {
        addLog("Error: Estructura de datos inválida.");
        setLeads([]);
      }
    } catch (error) {
      addLog("Fallo crítico en conexión.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const scrapeDomain = async () => {
    if (!targetUrl) return;
    setLoading(true);
    setScrapedEmails([]);
    setLogs([`Conectando a ${targetUrl}...`, "Inyectando script de extracción..."]);
    
    try {
      addLog("Analizando árbol DOM de la página...");
      const res = await fetch('/api/scrape-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (data.emails) {
        addLog(`Raspado finalizado: ${data.emails.length} contactos detectados.`);
        setScrapedEmails(data.emails);
        if (user) {
          await addDoc(collection(db, 'history'), {
            userId: user.uid,
            type: 'lead',
            payload: { domain: targetUrl, emailsFound: data.emails.length },
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      addLog("Acceso denegado o dominio caído.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (activeSubTab === 'sector' && leads.length === 0) return;
    if (activeSubTab === 'domain' && scrapedEmails.length === 0) return;

    let content = "";
    if (activeSubTab === 'sector') {
      content = "Nombre,Sitio Web,Email\n" + leads.map(l => `${l.name},${l.site},${l.email}`).join("\n");
    } else {
      content = "Email\n" + scrapedEmails.join("\n");
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `leads_${(sector || targetUrl).replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="card p-8 bg-white flex flex-col h-full">
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                <Database size={18} strokeWidth={2} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none">Lead Engine</h3>
                <p className="tech-label mt-1">B2B Mining & Scraping</p>
            </div>
        </div>
        {(leads.length > 0 || scrapedEmails.length > 0) && (
          <button 
            onClick={exportCSV}
            className="btn-secondary h-10 px-4"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </header>

      <div className="flex p-1 bg-slate-100 rounded-lg mb-8 w-fit">
        <button 
          onClick={() => setActiveSubTab('sector')}
          className={`px-6 py-2 text-xs font-semibold transition-all rounded-md ${activeSubTab === 'sector' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Sectores
        </button>
        <button 
          onClick={() => setActiveSubTab('domain')}
          className={`px-6 py-2 text-xs font-semibold transition-all rounded-md ${activeSubTab === 'domain' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Dominios
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={activeSubTab === 'sector' ? "Sector industrial (ej: AI Startups)..." : "Introducir dominio (ej: stripe.com)..."}
            className="input-field pl-4"
            value={activeSubTab === 'sector' ? sector : targetUrl}
            onChange={(e) => activeSubTab === 'sector' ? setSector(e.target.value) : setTargetUrl(e.target.value)}
          />
        </div>
        <button
          onClick={activeSubTab === 'sector' ? fetchLeads : scrapeDomain}
          disabled={loading || (activeSubTab === 'sector' ? !sector : !targetUrl)}
          className="btn-primary"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Search size={18} /> Iniciar Extracción
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="mb-8 p-4 bg-slate-900 rounded-lg font-mono text-[10px] text-slate-400 space-y-1">
            {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                    <span className="text-emerald-500">{'>>>'}</span>
                    {log}
                </div>
            ))}
            <div className="animate-pulse text-white">PROCESANDO_BYTES...</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {activeSubTab === 'sector' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {leads.map((lead, idx) => (
                <motion.div
                  key={`${lead.site}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-400 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-900 font-bold border border-slate-200">
                        {lead.name[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate leading-none mb-1">{lead.name}</h4>
                        <p className="tech-label !lowercase !tracking-tight opacity-60 truncate">{lead.site}</p>
                      </div>
                    </div>
                    <button 
                        onClick={() => window.open(`https://${lead.site}`, '_blank')}
                        className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                    >
                        <ExternalLink size={16} />
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-600">{lead.email}</span>
                    <button 
                        onClick={() => navigator.clipboard.writeText(lead.email)}
                        className="tech-label hover:text-slate-900 transition-colors"
                    >
                        Copy
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {scrapedEmails.map((email, idx) => (
                <motion.div
                  key={`${email}-${idx}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white transition-all flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded bg-white text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                      @
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="tech-label mb-1">Detected Email</p>
                    <p className="font-mono text-xs font-bold text-slate-800 break-all">{email}</p>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(email)}
                    className="w-full py-2 bg-white border border-slate-200 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all"
                  >
                    Sincronizar
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && leads.length === 0 && scrapedEmails.length === 0 && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-300 py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <Search size={48} strokeWidth={1} className="mb-4 opacity-10" />
              <p className="tech-label opacity-40">System Idle • Waiting for Input</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
