
import React, { useState, useEffect } from 'react';
import { Language, translations } from '../translations';
import { workspace } from '../services/workspaceService';
import { quotaService } from '../services/quotaService';
import { gemini } from '../services/geminiService';

interface IntegrationsProps {
  language: Language;
}

const Integrations: React.FC<IntegrationsProps> = ({ language }) => {
  const currentLang = language || 'es';
  const t = translations[currentLang]?.integrations || translations['es'].integrations;

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [systemHealth, setSystemHealth] = useState({ cloud: 'checking', gemini: 'checking', quota: 'checking' });
  const [showModal, setShowModal] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState('');

  useEffect(() => {
    loadKeys();
    checkHealth();

    console.log("%c[DEBUG] Omni Environment Check", "color: #3b82f6; font-weight: bold");
    const vKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    console.log("process.env.API_KEY:", process.env.API_KEY ? "EXISTS" : "MISSING");
    console.log("VITE_GEMINI_API_KEY:", vKey ? "EXISTS" : "MISSING");

    const handleUpdate = () => {
      // Solo actualizamos el estado visual de cuota si cambia algo
      // pero checkHealth() es asíncrono y pesado (hace un fetch)
      // así que mejor solo forzamos un re-render o una actualización ligera
      // Sin embargo, para que el contador cambie, necesitamos llamar a getQuotaStatusText
      // lo cual sucede en cada render. Solo necesitamos forzar un render.
      setSystemHealth(prev => ({ ...prev }));
    };

    window.addEventListener('quota_updated', handleUpdate);
    const interval = setInterval(handleUpdate, 1000); // Para el segundero

    return () => {
      window.removeEventListener('quota_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const checkHealth = async () => {
    setSystemHealth(prev => ({ ...prev, gemini: 'checking', cloud: 'checking' }));

    // Verificar conexión al Cloud (Google Apps Script)
    const cloudOk = await workspace.testConnection(workspace.getConfig().gasUrl);

    // NUEVO: Sonda real a Gemini (verifica Key y Cuota en un solo golpe)
    const geminiTest = await gemini.testConnection();
    const qPro = quotaService.getAvailability('pro');
    const qFlash = quotaService.getAvailability('flash');

    let geminiStatus = 'offline';
    if (geminiTest.success) {
      geminiStatus = 'online';
    } else {
      const msg = geminiTest.message.toLowerCase();
      if (msg.includes('429') || msg.includes('quota') || msg.includes('exhausted') || msg.includes('agotada')) {
        geminiStatus = 'exhausted';
      } else if (msg.includes('key') || msg.includes('invalid') || msg.includes('válida')) {
        geminiStatus = 'no_key';
      } else {
        geminiStatus = 'offline';
      }
    }

    setSystemHealth({
      cloud: cloudOk ? 'online' : 'offline',
      gemini: geminiStatus,
      quota: geminiStatus === 'no_key' ? 'no_key' : (qPro.isDailyBlocked || qFlash.isDailyBlocked ? 'limit' : 'safe')
    });
  };

  const getQuotaStatusText = () => {
    const q = quotaService.getAvailability('pro');
    if (systemHealth.gemini === 'no_key') return 'SIN API KEY';

    // Si hay un bloqueo diario (24h)
    if (q.isDailyBlocked) {
      const hours = Math.ceil(q.nextDailyAvailableIn / 3600);
      return `DÍA AGOTADO (RESETS ${hours}H)`;
    }

    // Si hay un bloqueo por minuto
    if (q.isMinuteBlocked) {
      return `MINUTO AGOTADO (${q.nextMinuteAvailableIn}S)`;
    }

    // Si no está bloqueado, mostrar qué tan cerca está del límite diario
    if (q.warning === 'LOW_QUOTA') return `¡CRÍTICO! (${q.rpdLeft} REST)`;

    return `SEGURO (${q.rpmLeft}/MIN)`;
  };

  const loadKeys = async () => {
    setIsSyncing(true);
    try {
      const savedKeys = localStorage.getItem('omni_api_keys');
      if (savedKeys) setApiKeys(JSON.parse(savedKeys));
      const cloudData = await workspace.fetchSystemData();
      if (cloudData && cloudData.settings) {
        // Las llaves se cargan desde workspaceService automáticamente al fetchSystemData
      }
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveKey = async () => {
    if (!showModal) return;
    const updatedKeys = { ...apiKeys, [showModal]: tempKey };
    setApiKeys(updatedKeys);
    localStorage.setItem('omni_api_keys', JSON.stringify(updatedKeys));
    await workspace.saveSetting(`key_${showModal}`, tempKey);
    setShowModal(null);
    setTempKey('');
  };

  const tools = [
    { id: 'apollo', ...t.tools.apollo, icon: '🚀' },
    { id: 'apify', ...t.tools.apify, icon: '☁️' },
    { id: 'hunter', ...t.tools.hunter, icon: '🎯' },
    { id: 'make', ...t.tools.make, icon: '⚡' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">{t.title}</h2>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <button
          onClick={loadKeys}
          disabled={isSyncing}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center gap-3 ${syncStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' :
            syncStatus === 'error' ? 'bg-red-500/10 border-red-500 text-red-400' :
              'bg-white/5 border-white/10 text-blue-400 hover:bg-white/10'
            }`}
        >
          {isSyncing ? 'Sincronizando...' : syncStatus === 'success' ? '✓ Sincronizado' : '🔄 Forzar Sincronización'}
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-6 rounded-3xl border border-white/10 flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full animate-pulse ${systemHealth.cloud === 'online' ? 'bg-emerald-500' : systemHealth.cloud === 'checking' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Cloud Engine</p>
            <p className={`text-xs font-bold ${systemHealth.cloud === 'online' ? 'text-white' : systemHealth.cloud === 'checking' ? 'text-yellow-400' : 'text-red-500'}`}>
              {systemHealth.cloud === 'online' ? 'CONECTADO' : systemHealth.cloud === 'checking' ? 'VERIFICANDO...' : 'DESCONECTADO'}
            </p>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-white/10 flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full animate-pulse ${systemHealth.gemini === 'online' ? 'bg-blue-500' : systemHealth.gemini === 'checking' ? 'bg-yellow-500' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">IA Core</p>
            <p className={`text-xs font-bold ${systemHealth.gemini === 'online' ? 'text-white' : systemHealth.gemini === 'checking' ? 'text-yellow-400' : 'text-red-500'}`}>
              {systemHealth.gemini === 'online' ? 'OPERATIVO' : systemHealth.gemini === 'no_key' ? 'SIN API KEY' : systemHealth.gemini === 'checking' ? 'VERIFICANDO...' : 'EXCEDIDO'}
            </p>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-white/10 flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full animate-pulse ${systemHealth.quota === 'safe' ? 'bg-indigo-500' : systemHealth.quota === 'checking' ? 'bg-yellow-500' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Cuota</p>
            <p className={`text-xs font-bold ${systemHealth.quota === 'safe' ? 'text-white' : systemHealth.quota === 'checking' ? 'text-yellow-400' : 'text-red-500'}`}>
              {systemHealth.quota === 'checking' ? 'VERIFICANDO...' : getQuotaStatusText()}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div key={tool.id} className="glass p-8 rounded-[2.5rem] border border-white/10 flex flex-col justify-between hover:border-blue-500/30 transition-all group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-4xl group-hover:scale-110 transition-transform">{tool.icon}</span>
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${apiKeys[tool.id] ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {apiKeys[tool.id] ? 'Activo ✓' : 'Desconectado'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white uppercase">{tool.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{tool.desc}</p>
              <div className="pt-4 space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Límite Free: <span className="text-white">{tool.limit}</span></p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uso: <span className="text-blue-400">{tool.use}</span></p>
              </div>
            </div>
            <button
              onClick={() => { setShowModal(tool.id); setTempKey(apiKeys[tool.id] || ''); }}
              className={`mt-8 w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${apiKeys[tool.id] ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'}`}
            >
              {apiKeys[tool.id] ? 'Configurar Llave' : 'Conectar Herramienta'}
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass w-full max-w-lg p-10 rounded-[2.5rem] border border-white/20">
            <h3 className="text-2xl font-black text-white mb-6 uppercase">Conectar {showModal.toUpperCase()}</h3>
            <p className="text-sm text-slate-400 mb-6">Pega tu API Key de {showModal}. Esta se sincronizará automáticamente con tu Google Sheet.</p>
            <input
              type="text" value={tempKey} onChange={e => setTempKey(e.target.value)}
              placeholder="sk-..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs text-white mb-6 outline-none focus:border-blue-500"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowModal(null)} className="flex-1 py-4 bg-white/5 rounded-xl text-white font-bold text-[10px] uppercase">Cerrar</button>
              <button onClick={handleSaveKey} className="flex-1 py-4 bg-blue-600 rounded-xl text-white font-bold text-[10px] uppercase">Guardar y Sincronizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
