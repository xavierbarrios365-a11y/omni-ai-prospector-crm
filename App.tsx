
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Roadmap from './components/Roadmap';
import Dashboard from './components/Dashboard';
import Prospector from './components/Prospector';
import CRM from './components/CRM';
import Marketing from './components/Marketing';
import Calendar from './components/Calendar';
import WorkPlan from './components/WorkPlan';
import KnowledgeBase from './components/KnowledgeBase';
import Integrations from './components/Integrations';
import Login from './components/Login';
import { Lead, LeadStatus, Task, Campaign, CalendarEvent, AIModelPreference } from './types';
import { Language } from './translations';
import { workspace } from './services/workspaceService';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [language, setLanguage] = useState<Language>('es');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiModelPreference, setAiModelPreference] = useState<AIModelPreference>(
    (localStorage.getItem('omni_ai_preference') as AIModelPreference) || 'auto'
  );

  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [coreError, setCoreError] = useState<string | null>(null);

  // SIEMPRE requiere validar conexión al backend (seguridad)
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [tempGasUrl, setTempGasUrl] = useState(workspace.getConfig().gasUrl || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('omni_ai_preference', aiModelPreference);
  }, [aiModelPreference]);

  useEffect(() => {
    const handleTabChange = (e: any) => { if (e.detail) setActiveTab(e.detail); };
    const handleSync = () => syncInitialData();
    const handleCoreError = (e: any) => setCoreError(e.detail || "Fallo de conexión crítico.");

    window.addEventListener('change_tab', handleTabChange);
    window.addEventListener('force_sync_all', handleSync);
    window.addEventListener('trigger_core_error', handleCoreError);

    return () => {
      window.removeEventListener('change_tab', handleTabChange);
      window.removeEventListener('force_sync_all', handleSync);
      window.removeEventListener('trigger_core_error', handleCoreError);
    };
  }, []);

  const syncInitialData = async () => {
    setIsSyncing(true);
    try {
      const data = await workspace.fetchSystemData();
      if (data && data.status === 'success') {
        if (Array.isArray(data.leads)) setLeads(data.leads);
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (Array.isArray(data.campaigns)) setCampaigns(data.campaigns);
        if (Array.isArray(data.events)) setEvents(data.events);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectCloud = async () => {
    if (!tempGasUrl) return;
    setIsConnecting(true);
    const isValid = await workspace.testConnection(tempGasUrl);
    if (isValid) {
      workspace.setConfig(tempGasUrl);
      setIsCloudConfigured(true);
    } else {
      setConnectionError("URL de script inválida o sin permisos.");
    }
    setIsConnecting(false);
  };

  if (!user) return <Login onLogin={setUser} language={language} setLanguage={setLanguage} />;

  if (!isCloudConfigured) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="glass w-full max-w-xl p-12 rounded-[3rem] border border-white/10 text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-blue-600/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Omni AI Cloud</h2>
            <p className="text-slate-500 text-xs mt-2">Conexión segura al backend requerida</p>
          </div>

          <input
            type="text"
            value={tempGasUrl}
            onChange={(e) => { setTempGasUrl(e.target.value); setConnectionError(null); }}
            placeholder="Pega tu URL de Apps Script..."
            className={`w-full bg-black/40 border rounded-2xl px-6 py-4 text-xs text-white outline-none transition-all ${connectionError ? 'border-red-500' : 'border-white/10 focus:border-blue-500'
              }`}
          />

          {connectionError && (
            <p className="text-red-400 text-xs font-bold">{connectionError}</p>
          )}

          <button
            onClick={handleConnectCloud}
            disabled={isConnecting || !tempGasUrl}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isConnecting ? 'bg-blue-800 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'
              } ${!tempGasUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Validando conexión...</span>
              </span>
            ) : 'Conectar Omni Engine'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0c]">
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab} language={language} setLanguage={setLanguage} onLogout={() => setUser(null)} user={user}
        onRefresh={syncInitialData} isRefreshing={isSyncing} modelPreference={aiModelPreference} setModelPreference={setAiModelPreference}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* REPORTE DE ERROR DEL NÚCLEO */}
        {coreError && (
          <div className="bg-red-600 text-white p-4 flex flex-col items-center text-center animate-bounce z-[200]">
            <p className="font-black text-[10px] uppercase tracking-[0.2em] mb-1">Reporte de Error del Núcleo</p>
            <p className="text-xs font-bold leading-relaxed max-w-2xl">
              Fallo de conexión (Proxy/Saturación). El sistema ha intentado reconectar 3 veces sin éxito.
              Por favor, refresca la página o intenta la búsqueda de nuevo en 30 segundos.
            </p>
            <button onClick={() => setCoreError(null)} className="mt-2 text-[8px] font-black uppercase underline">Entendido</button>
          </div>
        )}

        {isSyncing && (
          <div className="bg-blue-600 text-white text-[9px] font-black py-1 text-center uppercase tracking-widest animate-pulse">
            Sincronizando Estrategia Cloud...
          </div>
        )}

        <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto overflow-y-auto w-full custom-scrollbar">
          {activeTab === 'dashboard' && <Dashboard leads={leads} tasks={tasks} language={language} />}
          {activeTab === 'prospector' && <Prospector onImportLead={(l) => setLeads(prev => [...prev, l])} language={language} aiPreference={aiModelPreference} />}
          {activeTab === 'crm' && <CRM leads={leads} setLeads={setLeads} language={language} aiPreference={aiModelPreference} />}
          {activeTab === 'marketing' && <Marketing leads={leads} campaigns={campaigns} setCampaigns={setCampaigns} setTasks={setTasks} language={language} />}
          {activeTab === 'calendar' && <Calendar leads={leads} events={events} setEvents={setEvents} language={language} />}
          {activeTab === 'workplan' && <WorkPlan tasks={tasks} setTasks={setTasks} leads={leads} language={language} />}
          {activeTab === 'knowledge' && <KnowledgeBase language={language} />}
          {activeTab === 'integrations' && <Integrations language={language} />}
          {activeTab === 'roadmap' && <Roadmap language={language} />}
        </main>
      </div>
    </div>
  );
};

export default App;
