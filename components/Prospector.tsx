
import React, { useState, useEffect } from 'react';
import { gemini } from '../services/geminiService';
import { workspace } from '../services/workspaceService';
import { quotaService } from '../services/quotaService';
import { integrations } from '../services/integrationService';
import { Lead, LeadStatus, AIModelPreference } from '../types';
import { Language, translations } from '../translations';

interface ProspectorProps {
  onImportLead: (lead: Lead) => void;
  language: Language;
  aiPreference?: AIModelPreference;
}

const Prospector: React.FC<ProspectorProps> = ({ onImportLead, language, aiPreference = 'auto' }) => {
  const currentLang = language || 'es';
  const t = translations[currentLang]?.prospector || translations['es'].prospector;
  
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  const [quotaFlash, setQuotaFlash] = useState(quotaService.getAvailability('flash'));
  const [quotaPro, setQuotaPro] = useState(quotaService.getAvailability('pro'));

  useEffect(() => {
    const interval = setInterval(() => {
      setQuotaFlash(quotaService.getAvailability('flash'));
      setQuotaPro(quotaService.getAvailability('pro'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInitialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    setResults([]);
    try {
      // FIX: Cast aiPreference to AIModelPreference to satisfy TypeScript compiler
      const data = await gemini.prospectLeads(industry, location, 10, aiPreference as AIModelPreference);
      setResults(data.leads || []);
    } catch (err: any) {
      const msg = err.message;
      if (msg.includes('quota')) {
        setError("Límite de Google alcanzado. Intenta cambiar el motor a FLASH en la barra lateral.");
      } else {
        setError(msg);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (lead: Lead) => {
    if (importedIds.has(lead.id)) return;
    onImportLead(lead);
    setImportedIds(prev => new Set(prev).add(lead.id));
    await workspace.executeAction('saveLead', lead);
  };

  const activeMotor = aiPreference === 'auto' 
    ? (quotaPro.isDailyBlocked ? 'Flash (Auto-fallback)' : 'Pro (Auto)')
    : (aiPreference === 'pro' ? 'Gemini 3 Pro' : 'Gemini 3 Flash');

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">{t.title}</h2>
          <p className="text-slate-400 text-sm">Escaneo con motor activo: <span className="text-indigo-400 font-black">{activeMotor}</span></p>
        </div>
        
        <div className="flex gap-2">
           <div className={`glass px-4 py-2 border rounded-xl flex items-center space-x-3 bg-white/5 ${aiPreference === 'flash' ? 'border-emerald-500/30' : 'border-indigo-500/30'}`}>
              <span className={`text-[9px] font-black uppercase tracking-widest ${aiPreference === 'flash' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                Motor: {aiPreference.toUpperCase()}
              </span>
           </div>
        </div>
      </header>

      <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <form onSubmit={handleInitialSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.industryLabel}</label>
            <input type="text" placeholder="Ej: Clínicas..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.locationLabel}</label>
            <input type="text" placeholder="Ciudad, País" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>
          <div className="flex items-end">
            <button 
              disabled={isSearching || (aiPreference === 'pro' && quotaPro.isBlocked) || (aiPreference === 'flash' && quotaFlash.isBlocked)}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isSearching ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'}`}
            >
              {isSearching ? 'Escaneando...' : (aiPreference === 'pro' && quotaPro.isBlocked) ? 'Quota Pro 0/50' : 'Iniciar Búsqueda'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-red-400 text-xs font-bold flex flex-col space-y-2 animate-bounce">
          <div className="flex items-center space-x-3">
            <span>⚠️</span>
            <p className="font-black uppercase tracking-widest">Error de Núcleo detectado</p>
          </div>
          <p className="ml-7 opacity-80">{error}</p>
          <div className="ml-7 mt-2 pt-2 border-t border-red-500/10">
            <p className="text-[10px] uppercase">TIP: Cambia el motor de inteligencia en la barra lateral izquierda a FLASH para continuar.</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid gap-4">
          {results.map((lead) => (
            <div key={lead.id} className="glass p-6 rounded-[2rem] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all">
              <div className="flex-1 w-full">
                <h4 className="text-xl font-bold text-white mb-1">{lead.businessName}</h4>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">{lead.industry}</p>
                <p className="text-[10px] text-slate-500 mt-2">{lead.website}</p>
              </div>
              <button 
                onClick={() => handleImport(lead)} 
                disabled={importedIds.has(lead.id)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${importedIds.has(lead.id) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white text-black hover:bg-blue-600 hover:text-white'}`}
              >
                {importedIds.has(lead.id) ? '✓ Guardado' : 'Importar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Prospector;
