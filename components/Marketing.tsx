
import React, { useState, useEffect } from 'react';
import { Language, translations } from '../translations';
import { gemini } from '../services/geminiService';
import { workspace } from '../services/workspaceService';
import { Campaign, Lead, Task, LeadStatus } from '../types';

interface MarketingProps {
  language: Language;
  leads: Lead[];
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const Marketing: React.FC<MarketingProps> = ({ language, leads, campaigns, setCampaigns, setTasks }) => {
  const currentLang = language || 'es';
  const t = translations[currentLang]?.marketing || translations['es'].marketing;

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    industry: '',
    objective: '',
    description: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case LeadStatus.NEW: return 'bg-blue-500/10 text-blue-400';
      case LeadStatus.CONTACTED: return 'bg-amber-500/10 text-amber-400';
      case LeadStatus.QUALIFIED: return 'bg-purple-500/10 text-purple-400';
      case LeadStatus.CLOSED: return 'bg-emerald-500/10 text-emerald-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const [isGeneratingCopy, setIsGeneratingCopy] = useState<string | null>(null);
  const [generatedCopies, setGeneratedCopies] = useState<Record<string, string>>({});

  const handleGenerateCopy = async (lead: Lead) => {
    if (!selectedCampaign) {
      alert("Selecciona una campaña primero.");
      return;
    }
    setIsGeneratingCopy(lead.id);
    try {
      const copy = await gemini.generateMarketingCopy(lead, selectedCampaign);
      setGeneratedCopies(prev => ({ ...prev, [lead.id]: copy }));
    } catch (e: any) {
      alert("Error IA: " + e.message);
    } finally {
      setIsGeneratingCopy(null);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignData.industry) return;
    setIsGenerating(true);
    try {
      if (useAI) {
        // Creación con IA (comportamiento original)
        const result = await gemini.generateCampaign(newCampaignData.industry, newCampaignData.objective);
        setCampaigns(prev => [result.campaign, ...prev]);
        setTasks(prev => [...result.tasks, ...prev]);
        await workspace.executeAction('saveCampaign', result.campaign);
        for (const task of result.tasks) {
          await workspace.executeAction('saveTask', task);
        }
      } else {
        // Creación MANUAL sin IA
        const manualCampaign: Campaign = {
          id: `c-${Date.now()}`,
          name: newCampaignData.name || `Campaña ${newCampaignData.industry}`,
          targetIndustry: newCampaignData.industry,
          description: newCampaignData.description || newCampaignData.objective,
          status: 'Draft',
          leadsReached: 0,
          openRate: '0%'
        };
        setCampaigns(prev => [manualCampaign, ...prev]);
        await workspace.executeAction('saveCampaign', manualCampaign);
      }
      setShowCreateModal(false);
      setNewCampaignData({ name: '', industry: '', objective: '', description: '' });
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">AI Outreach Studio</h2>
          <p className="text-slate-400">Marketing inteligente con cerebro Cloud y Sincronización de Leads.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg uppercase tracking-widest"
        >
          + Nueva Campaña
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Campañas Activas</h3>
          {campaigns.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl text-center text-slate-600 text-xs font-bold uppercase">No hay campañas lanzadas</div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} onClick={() => setSelectedCampaign(c)} className={`glass p-6 rounded-3xl border ${selectedCampaign?.id === c.id ? 'border-blue-500 shadow-lg shadow-blue-600/10' : 'border-white/10'} cursor-pointer transition-all`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{c.targetIndustry}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{c.status}</span>
                </div>
                <h4 className="text-white font-bold">{c.name}</h4>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Objetivos de Ataque (Leads Disponibles)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leads.filter(l => l.industry.toLowerCase().includes(selectedCampaign?.targetIndustry.toLowerCase() || '')).map(lead => (
              <div key={lead.id} className="glass p-5 rounded-3xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="text-white font-bold truncate pr-2">{lead.businessName}</h4>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${getStatusColor(lead.status)}`}>{lead.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mb-4">{lead.website}</p>

                  {generatedCopies[lead.id] && (
                    <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                        <span>Copy Generado ✨</span>
                        <button onClick={() => navigator.clipboard.writeText(generatedCopies[lead.id])} className="hover:text-white transition-colors">Copiar</button>
                      </p>
                      <p className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">{generatedCopies[lead.id]}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {lead.email ? <span className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-[10px]">📧</span> : <span className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center text-[10px] grayscale opacity-50">❌</span>}
                    {lead.instagram ? <span className="w-6 h-6 rounded bg-pink-500/10 flex items-center justify-center text-[10px]">📸</span> : <span className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center text-[10px] grayscale opacity-50">❌</span>}
                    {lead.facebook ? <span className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-[10px]">👥</span> : <span className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center text-[10px] grayscale opacity-50">❌</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleGenerateCopy(lead)}
                  disabled={isGeneratingCopy === lead.id || !selectedCampaign}
                  className={`mt-4 w-full py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all ${isGeneratingCopy === lead.id ? 'bg-slate-800' : 'bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-400 border border-white/5'}`}
                >
                  {isGeneratingCopy === lead.id ? 'Generando...' : 'Generar Copy de Ataque'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-lg p-10 rounded-[2.5rem] border border-white/20">
            <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Nueva Campaña</h3>

            {/* Toggle IA / Manual */}
            <div className="flex mb-6 bg-black/40 rounded-xl p-1">
              <button
                onClick={() => setUseAI(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${useAI ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                ⚡ Con IA
              </button>
              <button
                onClick={() => setUseAI(false)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${!useAI ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
              >
                ✏️ Manual
              </button>
            </div>

            <div className="space-y-4">
              {!useAI && (
                <input
                  type="text"
                  placeholder="Nombre de la campaña..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                  value={newCampaignData.name}
                  onChange={e => setNewCampaignData({ ...newCampaignData, name: e.target.value })}
                />
              )}
              <input
                type="text"
                placeholder="Nicho / Industria..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                value={newCampaignData.industry}
                onChange={e => setNewCampaignData({ ...newCampaignData, industry: e.target.value })}
              />
              <textarea
                placeholder={useAI ? "Objetivo de la campaña..." : "Descripción de la campaña..."}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-32"
                value={useAI ? newCampaignData.objective : newCampaignData.description}
                onChange={e => setNewCampaignData({
                  ...newCampaignData,
                  [useAI ? 'objective' : 'description']: e.target.value
                })}
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => { setShowCreateModal(false); setNewCampaignData({ name: '', industry: '', objective: '', description: '' }); }}
                  className="flex-1 py-4 bg-white/10 rounded-xl font-bold text-white uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCampaign}
                  disabled={isGenerating}
                  className={`flex-1 py-4 rounded-xl font-bold text-white uppercase tracking-widest text-xs ${useAI ? 'bg-blue-600' : 'bg-emerald-600'}`}
                >
                  {isGenerating ? 'Procesando...' : (useAI ? 'Generar con IA' : 'Crear Campaña')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;
