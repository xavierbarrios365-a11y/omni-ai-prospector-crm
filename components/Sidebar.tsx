
import React, { useState, useEffect } from 'react';
import { Language, translations } from '../translations';
import { quotaService } from '../services/quotaService';
import { AIModelPreference } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  onLogout: () => void;
  user: any;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  modelPreference: AIModelPreference;
  setModelPreference: (p: AIModelPreference) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, language, setLanguage, onLogout, user, isOpen, setIsOpen, onRefresh, isRefreshing,
  modelPreference, setModelPreference
}) => {
  const currentLang = language || 'es';
  const t = translations[currentLang]?.sidebar || translations['es'].sidebar;
  
  const [quotas, setQuotas] = useState({
    flash: quotaService.getAvailability('flash'),
    pro: quotaService.getAvailability('pro')
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setQuotas({
        flash: quotaService.getAvailability('flash'),
        pro: quotaService.getAvailability('pro')
      });
    }, 1000);
    
    const handleUpdate = () => {
      setQuotas({
        flash: quotaService.getAvailability('flash'),
        pro: quotaService.getAvailability('pro')
      });
    };

    window.addEventListener('quota_updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('quota_updated', handleUpdate);
    };
  }, []);

  const renderQuotaBar = (label: string, availability: any, color: string) => {
    const rpmPerc = (availability.rpmLeft / availability.rpmTotal) * 100;
    const rpdPerc = (availability.rpdLeft / availability.rpdTotal) * 100;
    const isBlocked = availability.isBlocked;
    
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className={`text-[7px] font-black uppercase tracking-widest ${isBlocked ? 'text-red-400' : 'text-slate-500'}`}>
            {label} {availability.rpmLeft}/{availability.rpmTotal}
          </span>
        </div>
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full bg-${color}-500 transition-all duration-500`} style={{ width: `${rpmPerc}%` }}></div>
        </div>
        <div className="flex justify-between items-center text-[6px] font-bold text-slate-600 uppercase">
          <span>Día: {availability.rpdLeft}/{availability.rpdTotal}</span>
        </div>
      </div>
    );
  };

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'prospector', label: t.prospector, icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { id: 'crm', label: t.crm, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'marketing', label: t.marketing, icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    { id: 'calendar', label: t.calendar, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'knowledge', label: t.knowledge, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'integrations', label: t.integrations, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen?.(false)}></div>}

      <div className={`fixed inset-y-0 left-0 w-64 border-r border-white/10 flex flex-col h-screen bg-[#0d0d0f] z-50 transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-6 pb-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tighter uppercase">Omni AI</h1>
          
          <div className="mt-6 p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
             <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Sincronización Cloud</p>
             {renderQuotaBar('Flash Core', quotas.flash, 'blue')}
             {renderQuotaBar('Pro Analyzer', quotas.pro, 'indigo')}
          </div>
        </div>

        {/* SELECTOR DE MOTOR DE INTELIGENCIA */}
        <div className="px-6 py-2">
           <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
              <p className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 text-center">Núcleo de Inteligencia</p>
              <div className="flex bg-black/40 rounded-xl p-1 gap-1">
                 {(['auto', 'pro', 'flash'] as const).map((pref) => (
                   <button 
                     key={pref}
                     onClick={() => setModelPreference(pref)}
                     className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${modelPreference === pref ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     {pref}
                   </button>
                 ))}
              </div>
              <p className="text-[6px] text-slate-600 mt-2 text-center leading-tight">
                {modelPreference === 'auto' ? 'IA decide según complejidad' : 
                 modelPreference === 'pro' ? 'Máxima precisión (50/día)' : 
                 'Máximo volumen (1500/día)'}
              </p>
           </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsOpen?.(false); }} className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              <span className="font-medium text-xs tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 space-y-2 border-t border-white/10 bg-black/20">
          <button onClick={onRefresh} disabled={isRefreshing} className="w-full bg-white/5 hover:bg-blue-600/10 text-slate-300 hover:text-blue-400 border border-white/5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center space-x-2">
            {isRefreshing ? <div className="animate-spin w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"></div> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9" strokeWidth={2}/></svg>}
            <span>Sync</span>
          </button>
          <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[9px] uppercase">{user?.avatar || 'U'}</div>
              <p className="text-[9px] font-black text-white truncate uppercase">{user?.name || 'Omni'}</p>
            </div>
            <button onClick={onLogout} className="text-slate-500 hover:text-red-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
