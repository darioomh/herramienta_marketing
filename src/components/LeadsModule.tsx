import React, { useState } from 'react';
import { Database, Search, MapPin, Building2, ExternalLink, Mail, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Lead {
  name: string;
  site: string;
  email: string;
}

export default function LeadsModule() {
  const [activeSubTab, setActiveSubTab] = useState<'sector' | 'domain'>('sector');
  const [sector, setSector] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scrapedEmails, setScrapedEmails] = useState<string[]>([]);

  const fetchLeads = async () => {
    if (!sector) return;
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector, location: 'Global' }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      } else {
        console.error("Unexpected data format:", data);
        setLeads([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const scrapeDomain = async () => {
    if (!targetUrl) return;
    setLoading(true);
    try {
      const res = await fetch('/api/scrape-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (data.emails) setScrapedEmails(data.emails);
    } catch (error) {
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
    <div className="card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Extractor de Leads</h3>
            <p className="text-sm text-zinc-500">Obtén contactos de negocios.</p>
          </div>
        </div>
        {(leads.length > 0 || scrapedEmails.length > 0) && (
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Download size={14} /> EXPORTAR
          </button>
        )}
      </div>

      {/* Selector de Sub-pestaña */}
      <div className="flex gap-4 border-b border-zinc-100 mb-6">
        <button 
          onClick={() => setActiveSubTab('sector')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'sector' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-400'}`}
        >
          Búsqueda por Sector
        </button>
        <button 
          onClick={() => setActiveSubTab('domain')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'domain' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-400'}`}
        >
          Scanner de Dominio
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder={activeSubTab === 'sector' ? "ej. SaaS, Inmobiliaria, Fintech" : "ej. apple.com o https://tesla.com"}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            value={activeSubTab === 'sector' ? sector : targetUrl}
            onChange={(e) => activeSubTab === 'sector' ? setSector(e.target.value) : setTargetUrl(e.target.value)}
          />
        </div>
        <button
          onClick={activeSubTab === 'sector' ? fetchLeads : scrapeDomain}
          disabled={loading || (activeSubTab === 'sector' ? !sector : !targetUrl)}
          className="btn-primary !bg-indigo-600 hover:!bg-indigo-700 h-10 w-10 flex items-center justify-center p-0"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {activeSubTab === 'sector' ? (
            leads.map((lead, idx) => (
              <motion.div
                key={lead.site}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group p-4 border border-zinc-100 rounded-xl mb-3 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-zinc-900 group-hover:text-indigo-700 transition-colors">{lead.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <ExternalLink size={12} /> {lead.site}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Mail size={12} /> {lead.email}
                    </span>
                  </div>
                </div>
                <button className="p-2 text-zinc-300 hover:text-indigo-600 transition-colors">
                  <Download size={16} />
                </button>
              </motion.div>
            ))
          ) : (
            scrapedEmails.map((email, idx) => (
              <motion.div
                key={email}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group p-4 border border-zinc-100 rounded-xl mb-3 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                    {email[0]}
                  </div>
                  <span className="font-mono text-xs text-zinc-700">{email}</span>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(email)}
                  className="px-3 py-1 bg-white border border-zinc-200 rounded text-xs hover:bg-indigo-600 hover:text-white transition-all"
                >
                  Copiar
                </button>
              </motion.div>
            ))
          )}

          {!loading && leads.length === 0 && scrapedEmails.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-12">
              <Search size={40} className="mb-4 opacity-20" />
              <p className="text-sm">Inicia una búsqueda o escaneo para obtener contactos</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
