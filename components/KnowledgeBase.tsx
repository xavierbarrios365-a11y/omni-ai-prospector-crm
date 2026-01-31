
import React, { useState, useEffect, useRef } from 'react';
import { StrategyGuide } from '../types';
import { gemini } from '../services/geminiService';
import { Language, translations } from '../translations';
import { workspace } from '../services/workspaceService';

interface KnowledgeBaseProps {
  language: Language;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ language }) => {
  const currentLang = language || 'es';
  const t = translations[currentLang]?.knowledge || translations['es'].knowledge;

  const [guides, setGuides] = useState<StrategyGuide[]>([]);
  const [researchLogs, setResearchLogs] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'history'>('materials');
  const [isLoading, setIsLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({ title: '', content: '', category: 'General' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadCloudKnowledge();
  }, []);

  const loadCloudKnowledge = async () => {
    setIsLoading(true);
    try {
      const data = await workspace.fetchSystemData();
      if (data && data.status === 'success') {
        if (Array.isArray(data.knowledge)) setGuides(data.knowledge);
        if (Array.isArray(data.researchLogs)) setResearchLogs(data.researchLogs);
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleAskAI = async () => {
    if (!aiQuery.trim() || isAsking) return;
    setIsAsking(true);
    setAiAnswer("Analizando documentos y preparando respuesta...");
    try {
      const context = guides.map(g => `[${g.category}] ${g.title}: ${g.content}`).join("\n---\n");
      const answer = await gemini.askQuestion(aiQuery, context);
      setAiAnswer(answer);
      setAiQuery('');
    } catch (e: any) {
      setAiAnswer("Error al consultar al Cerebro Omni: " + (e.message || "Error desconocido"));
    } finally {
      setIsAsking(false);
    }
  };

  const handleDeleteCard = async (guide: StrategyGuide) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este material?")) return;
    setIsSyncing(guide.id);
    try {
      const result = await workspace.executeAction('deleteKnowledge', { id: guide.id, title: guide.title });
      if (result.status === 'deleted') {
        setGuides(prev => prev.filter(g => g.id !== guide.id));
      }
    } catch (e) { console.error(e); } finally { setIsSyncing(null); }
  };

  const handleAddCard = async () => {
    if (!newCard.title && !selectedFile) return;
    setIsSyncing('new');
    try {
      let payload: any = { title: newCard.title || selectedFile?.name, category: newCard.category, content: newCard.content };
      if (selectedFile) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          payload.fileData = base64;
          payload.mimeType = selectedFile.type;
          payload.fileName = selectedFile.name;
          payload.id = new Date().toLocaleString(); // Usamos la fecha como ID inicial
          const result = await workspace.executeAction('saveKnowledge', payload);
          setShowAddModal(false);
          setSelectedFile(null);
          setNewCard({ title: '', content: '', category: 'General' });
          loadCloudKnowledge();
          setIsSyncing(null);
        };
      } else {
        payload.id = new Date().toLocaleString();
        await workspace.executeAction('saveKnowledge', payload);
        setShowAddModal(false);
        loadCloudKnowledge();
        setIsSyncing(null);
      }
    } catch (e) { setIsSyncing(null); }
  };

  const getFileIcon = (title: string = '') => {
    const low = title.toLowerCase();
    if (low.includes('pdf')) return '📕';
    if (low.includes('doc')) return '📘';
    if (low.includes('xls') || low.includes('csv')) return '📗';
    if (low.includes('png') || low.includes('jpg')) return '🖼️';
    return '📝';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">{t.title}</h2>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg uppercase tracking-widest">+ {t.addCard || 'Cargar Material'}</button>
      </header>

      <div className="flex space-x-6 border-b border-white/5 pb-2">
        <button onClick={() => setActiveSubTab('materials')} className={`text-[10px] font-black uppercase tracking-widest pb-2 ${activeSubTab === 'materials' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>📚 Material Estratégico</button>
        <button onClick={() => setActiveSubTab('history')} className={`text-[10px] font-black uppercase tracking-widest pb-2 ${activeSubTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>🕰️ Historial de Inteligencia</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? <div className="py-20 text-center glass rounded-3xl animate-pulse">Cargando Nube...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSubTab === 'materials' ? (
                guides.map(guide => (
                  <div key={guide.id} className="glass p-6 rounded-3xl border border-white/10 flex flex-col h-full hover:border-blue-500/40 transition-all relative group/card">
                    <button
                      onClick={() => handleDeleteCard(guide)}
                      disabled={isSyncing === guide.id}
                      className="absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-all"
                    >
                      {isSyncing === guide.id ? '...' : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg>}
                    </button>
                    <div className="flex justify-between items-start mb-4 pr-8">
                      <span className="text-[9px] font-black text-blue-400 uppercase bg-blue-500/10 px-2 py-1 rounded">{guide.category}</span>
                      {guide.fileUrl && <a href={guide.fileUrl} target="_blank" className="text-[10px] text-emerald-400 hover:underline">🔗 Drive</a>}
                    </div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getFileIcon(guide.title)}</span>
                      <h3 className="text-lg font-bold text-white truncate">{guide.title}</h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed italic line-clamp-4">{guide.content}</p>
                  </div>
                ))
              ) : (
                researchLogs.map((log, i) => (
                  <div key={i} className="glass p-5 rounded-3xl border border-white/5">
                    <div className="flex justify-between text-[9px] font-black text-amber-500 uppercase mb-2"><span>{log.date}</span><span>{log.leadName}</span></div>
                    <p className="text-xs text-slate-400 italic line-clamp-3">"{log.plan}"</p>
                  </div>
                )).reverse()
              )}
            </div>
          )}
        </div>

        <div className="glass p-8 rounded-[2rem] border border-blue-500/20 h-[500px] flex flex-col shadow-2xl">
          <h3 className="text-xs font-black text-blue-400 uppercase mb-4 flex items-center">⚡ Cerebro Omni</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 text-slate-300 text-sm whitespace-pre-wrap">
            {isAsking ? (
              <div className="flex items-center space-x-2 text-blue-400 animate-pulse">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Pensando...</span>
              </div>
            ) : aiAnswer || "Pregúntame sobre tus documentos o estrategias..."}
          </div>
          <div className="relative">
            <input
              type="text"
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAskAI()}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 pr-12"
              placeholder="¿Cómo cerrar el lead X?"
            />
            <button
              onClick={handleAskAI}
              disabled={isAsking}
              className="absolute right-3 top-2.5 w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
            >
              {isAsking ? '...' : '➜'}
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="glass w-full max-w-lg p-10 rounded-[2.5rem] border border-white/20">
            <h3 className="text-2xl font-black text-white mb-6 uppercase">Subir a Omni Cloud</h3>
            <div className="space-y-4">
              <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={newCard.category} onChange={e => setNewCard({ ...newCard, category: e.target.value })}>
                <option value="Branding">Branding / Stack Técnico</option>
                <option value="Strategy">Estrategia Comercial</option>
                <option value="Legal">Documentación Legal</option>
              </select>
              <input type="text" placeholder="Título" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={newCard.title} onChange={e => setNewCard({ ...newCard, title: e.target.value })} />
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-all">
                <input type="file" ref={fileInputRef} className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                <span className="text-white font-bold">{selectedFile ? selectedFile.name : 'Haz clic para subir un archivo'}</span>
              </div>
              <textarea placeholder="Notas adicionales..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-24" value={newCard.content} onChange={e => setNewCard({ ...newCard, content: e.target.value })} />
              <div className="flex gap-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-white/5 rounded-xl text-white font-bold">Cancelar</button>
                <button onClick={handleAddCard} disabled={!!isSyncing} className="flex-1 py-4 bg-blue-600 rounded-xl text-white font-bold">{isSyncing ? 'Sincronizando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
