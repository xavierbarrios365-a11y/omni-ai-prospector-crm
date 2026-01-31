
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, AIModelPreference } from '../types';
import { gemini } from '../services/geminiService';
import { workspace } from '../services/workspaceService';
import { quotaService } from '../services/quotaService';
import { Language, translations } from '../translations';
import { integrations } from '../services/integrationService';

interface CRMProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  language: Language;
  aiPreference?: AIModelPreference;
}

const CRM: React.FC<CRMProps> = ({ leads, setLeads, language, aiPreference = 'auto' }) => {
  const currentLang = language || 'es';
  const t = translations[currentLang]?.crm || translations['es'].crm;
  
  const [isResearching, setIsResearching] = useState<string | null>(null);
  const [knowledgeContext, setKnowledgeContext] = useState("");
  const [quotaPro, setQuotaPro] = useState(quotaService.getAvailability('pro'));
  const [quotaFlash, setQuotaFlash] = useState(quotaService.getAvailability('flash'));

  useEffect(() => {
    loadContext();
    const interval = setInterval(() => {
      setQuotaPro(quotaService.getAvailability('pro'));
      setQuotaFlash(quotaService.getAvailability('flash'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadContext = async () => {
    try {
      const data = await workspace.fetchSystemData();
      if (data && Array.isArray(data.knowledge)) {
        const ctx = data.knowledge.map((k: any) => `[${k.category}] ${k.title}: ${k.content}`).join("\n---\n");
        setKnowledgeContext(ctx);
      }
    } catch (e) { console.error(e); }
  };

  const columns = [
    { title: t.colNew, status: LeadStatus.NEW, color: 'blue' },
    { title: t.colContacted, status: LeadStatus.CONTACTED, color: 'amber' },
    { title: t.colQualified, status: LeadStatus.QUALIFIED, color: 'purple' },
    { title: t.colClosed, status: LeadStatus.CLOSED, color: 'emerald' },
  ];

  const handleDeepResearch = async (lead: Lead) => {
    setIsResearching(lead.id);
    try {
      // FIX: Cast aiPreference to AIModelPreference to satisfy TypeScript compiler
      const enrichedData = await gemini.enhanceLeadData(lead, knowledgeContext, aiPreference as AIModelPreference);
      
      if (enrichedData) {
        const updatedLead = { ...lead, ...enrichedData };
        setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
        await workspace.executeAction('saveLead', updatedLead);
      }
    } catch (error: any) {
      alert(error.message || "Error de cuota.");
    } finally {
      setIsResearching(null);
    }
  };

  const updateLeadStatus = async (lead: Lead, newStatus: LeadStatus) => {
    const updatedLead = { ...lead, status: newStatus };
    setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
    await workspace.executeAction('saveLead', updatedLead);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tighter">{t.title}</h2>
          <p className="text-slate-400 text-sm">Motor CRM: <span className="text-indigo-400 font-bold uppercase">{aiPreference}</span></p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:space-x-6 overflow-x-auto pb-6 custom-scrollbar">
        {columns.map((col) => (
          <div key={col.status} className="flex-shrink-0 w-full md:w-84">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-slate-300 flex items-center text-sm uppercase tracking-widest">
                <span className={`w-2.5 h-2.5 rounded-full bg-${col.color}-500 mr-2`}></span>
                {col.title}
              </h3>
              <span className="text-[10px] text-slate-600 font-bold">{leads.filter(l => l.status === col.status).length}</span>
            </div>
            
            <div className="space-y-4">
              {leads
                .filter(l => l.status === col.status)
                .map((lead) => {
                  return (
                    <div key={lead.id} className="glass p-5 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-all group relative">
                      <div className="flex justify-between mb-3">
                        <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest truncate max-w-[120px]">{lead.industry}</p>
                        <select 
                          value={lead.status} 
                          onChange={(e) => updateLeadStatus(lead, e.target.value as LeadStatus)}
                          className="bg-black/40 text-[9px] font-black text-slate-400 border-none rounded-lg px-2 py-0.5 outline-none cursor-pointer hover:text-white"
                        >
                          {columns.map(c => <option key={c.status} value={c.status}>{c.title}</option>)}
                        </select>
                      </div>

                      <h4 className="font-bold text-white text-base mb-1 truncate">{lead.businessName}</h4>
                      
                      <div className="space-y-1 mb-4">
                        {lead.email ? (
                          <p className="text-[11px] text-emerald-400 font-black truncate flex items-center bg-emerald-500/5 p-1.5 rounded">
                            <span className="mr-2">📧</span> {lead.email}
                          </p>
                        ) : (
                          <p className="text-[10px] text-red-400 font-black uppercase tracking-tighter flex items-center bg-red-500/5 p-1.5 rounded">
                            <span className="mr-2">⚠️</span> Sin Datos
                          </p>
                        )}
                      </div>
                      
                      {lead.attackPlan && (
                        <div className="mb-4 p-3 bg-blue-600/5 border border-blue-500/20 rounded-xl">
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span>
                            Estrategia (IA)
                          </p>
                          <p className="text-[10px] text-slate-300 leading-relaxed italic line-clamp-5">"{lead.attackPlan}"</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <button 
                          onClick={() => handleDeepResearch(lead)} 
                          disabled={isResearching === lead.id}
                          className={`flex-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${isResearching === lead.id ? 'bg-slate-800' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white'}`}
                        >
                          {isResearching === lead.id ? 'Auditoría...' : `Investigación ${aiPreference === 'flash' ? 'Lite' : 'IQ'}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CRM;
