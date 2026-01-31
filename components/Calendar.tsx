
import React, { useState } from 'react';
import { CalendarEvent, Lead } from '../types';
import { gemini } from '../services/geminiService';
import { workspace } from '../services/workspaceService';
import { Language, translations } from '../translations';

interface CalendarProps {
  leads: Lead[];
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  language: Language;
}

const Calendar: React.FC<CalendarProps> = ({ leads, events, setEvents, language }) => {
  const t = translations[language].calendar;
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Partial<CalendarEvent>[]>([]);

  const handleGenerateAiSuggestions = async () => {
    setIsGenerating(true);
    setShowAiModal(true);
    try {
      const ideas = await gemini.suggestContentIdeas(leads);
      if (Array.isArray(ideas)) setAiSuggestions(ideas);
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const acceptSuggestion = async (suggestion: any) => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + Math.floor(Math.random() * 10));
    
    const event: CalendarEvent = {
      ...suggestion,
      id: 'ev-' + Date.now() + Math.random().toString(36).substr(2, 4),
      date: futureDate.toISOString().split('T')[0],
      day: futureDate.getDate(),
      status: 'scheduled'
    };
    
    setEvents(prev => [...prev, event]);
    await workspace.executeAction('saveEvent', event);
    setAiSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const typeColors: any = {
    Instagram: 'border-pink-500 text-pink-400 bg-pink-500/5',
    Facebook: 'border-blue-500 text-blue-400 bg-blue-500/5',
    LinkedIn: 'border-blue-700 text-blue-300 bg-blue-700/5',
    TikTok: 'border-slate-200 text-slate-100 bg-white/5',
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Content Cloud Strategy</h2>
          <p className="text-slate-500 text-sm">Sincronización total con Google Calendar activa.</p>
        </div>
        <button onClick={handleGenerateAiSuggestions} className="bg-amber-500 hover:scale-105 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all uppercase tracking-widest flex items-center space-x-2">
           <span>⚡ Generar Plan IA a Cloud</span>
        </button>
      </header>

      <div className="glass p-6 rounded-3xl border border-white/10 overflow-x-auto">
        <div className="min-w-[1000px] grid grid-cols-7 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => <div key={d} className="p-4 text-center text-[10px] font-black uppercase text-slate-500 bg-black/40">{d}</div>)}
          {Array.from({ length: 35 }, (_, i) => {
            const dayNum = i - 3;
            const dayEvents = events.filter(e => e.day === dayNum);
            return (
              <div key={i} className="min-h-[160px] p-2 bg-[#0d0d0f] border-r border-b border-white/5">
                <span className="text-[10px] font-bold text-slate-700">{dayNum > 0 && dayNum <= 31 ? dayNum : ''}</span>
                <div className="mt-2 space-y-2">
                  {dayEvents.map(event => (
                    <div key={event.id} className={`p-2 rounded-xl border text-[9px] ${typeColors[event.socialNetwork || 'Instagram']}`}>
                      <p className="font-bold text-white truncate">{event.title}</p>
                      <span className="text-[7px] font-black opacity-60">{event.socialNetwork?.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-4xl p-8 rounded-[2.5rem] border border-white/20 flex flex-col max-h-[90vh]">
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Sugerencias Estratégicas IA</h3>
              <button onClick={() => setShowAiModal(false)} className="text-white">✕</button>
            </header>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
              {isGenerating ? (
                <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Consultando el Cerebro IA y verificando nichos...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiSuggestions.map((s, idx) => (
                    <div key={idx} className="glass p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{s.socialNetwork}</span>
                        <h4 className="text-white font-bold mt-2">{s.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-2">{s.pillar} • {s.objective}</p>
                      </div>
                      <button onClick={() => acceptSuggestion(s)} className="mt-4 bg-emerald-600 py-2 rounded-xl text-white font-bold text-[10px] uppercase">Agendar a Cloud</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
