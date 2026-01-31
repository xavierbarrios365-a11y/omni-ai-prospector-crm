
import React, { useState, useEffect } from 'react';
import { Lead, Task } from '../types';
import { Language, translations } from '../translations';
import { quotaService } from '../services/quotaService';

interface DashboardProps {
  leads: Lead[];
  tasks: Task[];
  language: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ leads, tasks, language }) => {
  const currentLang = language || 'es';
  const t = translations[currentLang]?.dashboard || translations['es'].dashboard;
  
  const [tokenConsumption, setTokenConsumption] = useState(quotaService.getTotalTokens());
  const [quotaPro, setQuotaPro] = useState(quotaService.getAvailability('pro'));
  const [quotaFlash, setQuotaFlash] = useState(quotaService.getAvailability('flash'));

  useEffect(() => {
    const handleUpdate = () => {
      setTokenConsumption(quotaService.getTotalTokens());
      setQuotaPro(quotaService.getAvailability('pro'));
      setQuotaFlash(quotaService.getAvailability('flash'));
    };
    
    const interval = setInterval(handleUpdate, 1000);
    window.addEventListener('quota_updated', handleUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('quota_updated', handleUpdate);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds > 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">{t.title}</h2>
          <p className="text-slate-400 text-sm">Monitor de actividad y consumo de recursos IA (Ventana 24h).</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="glass flex-1 md:flex-none px-6 py-3 rounded-2xl border border-white/10 text-center">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Tokens Totales</p>
            <p className="text-xl font-black text-blue-400">{tokenConsumption.toLocaleString()}</p>
          </div>
          
          <div className={`glass flex-1 md:flex-none px-6 py-3 rounded-2xl border text-center transition-all ${quotaPro.isDailyBlocked ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-indigo-500/30'}`}>
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Pro Analyzer</p>
            <p className={`text-xl font-black ${quotaPro.isDailyBlocked ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
              {quotaPro.rpdLeft} / {quotaPro.rpdTotal}
            </p>
            {quotaPro.isDailyBlocked && (
              <p className="text-[6px] font-black text-red-400 uppercase mt-1">Reset: {formatTime(quotaPro.nextAvailableIn)}</p>
            )}
          </div>

          <div className={`glass flex-1 md:flex-none px-6 py-3 rounded-2xl border text-center transition-all ${quotaFlash.isDailyBlocked ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-blue-500/30'}`}>
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Flash Core</p>
            <p className={`text-xl font-black ${quotaFlash.isDailyBlocked ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
              {quotaFlash.rpdLeft} / {quotaFlash.rpdTotal}
            </p>
          </div>
        </div>
      </header>

      {(quotaPro.isDailyBlocked || quotaFlash.isDailyBlocked) && (
        <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-red-600/30">⚠️</div>
            <div>
              <p className="text-xl font-black text-white uppercase tracking-tighter">Estado: Saturación de Cuota Detectada</p>
              <p className="text-xs text-red-400 font-bold uppercase tracking-widest">
                Google ha bloqueado las peticiones temporalmente. {quotaPro.isDailyBlocked ? `El motor Pro se restaurará en ${formatTime(quotaPro.nextAvailableIn)}.` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('change_tab', { detail: 'integrations' }))}
            className="w-full md:w-auto px-8 py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-500 transition-all"
          >
            Ver Salud del Sistema
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-8 rounded-3xl border border-white/10 group hover:border-blue-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Leads en CRM</p>
          <p className="text-5xl font-black text-white mt-2 group-hover:text-blue-400 transition-colors">{leads.length}</p>
        </div>
        <div className="glass p-8 rounded-3xl border border-white/10 group hover:border-indigo-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Tareas Pendientes</p>
          <p className="text-5xl font-black text-white mt-2 group-hover:text-indigo-400 transition-colors">{tasks.length}</p>
        </div>
        <div className="glass p-8 rounded-3xl border border-white/10">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Herramientas Cloud</p>
          <p className="text-5xl font-black text-white mt-2">4</p>
          <p className="text-[8px] text-slate-600 mt-2 font-bold uppercase">Apollo, Apify, Hunter, Make</p>
        </div>
        <div className="glass p-8 rounded-3xl border border-white/10">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Eficiencia</p>
          <p className="text-5xl font-black text-emerald-400 mt-2">A+</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
