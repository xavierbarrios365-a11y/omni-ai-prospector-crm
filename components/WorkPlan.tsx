import React, { useState, useEffect } from 'react';
import { Lead, Task } from '../types';
import { gemini } from '../services/geminiService';
import { workspace } from '../services/workspaceService';
import { Language, translations } from '../translations';

interface WorkPlanProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  leads: Lead[];
  language: Language;
}

const WorkPlan: React.FC<WorkPlanProps> = ({ tasks, setTasks, leads, language }) => {
  const t = translations[language].workplan;
  const wt = translations[language].workspace;
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const columns: { id: Task['status']; title: string }[] = [
    { id: 'todo', title: t.cols.todo },
    { id: 'in-progress', title: t.cols.progress },
    { id: 'done', title: t.cols.done },
  ];

  const generateAIPlan = async () => {
    if (leads.length === 0) {
      alert(language === 'es' ? "Primero importa algunos leads para generar un plan estratégico." : "First import some leads to generate a strategic plan.");
      return;
    }
    setIsGenerating(true);
    try {
      const aiTasks = await gemini.generateStrategicPlan(leads);
      setTasks(prev => [...aiTasks, ...prev]);
      // Persistir nuevas tareas al cloud
      for (const task of aiTasks) {
        await workspace.executeAction('saveTask', task);
      }
      alert(language === 'es' ? "Omni IA ha diseñado 5 nuevas tareas estratégicas basadas en tus leads." : "Omni AI has designed 5 new strategic tasks based on your leads.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const updatedTask = tasks.find(t => t.id === taskId);
    if (updatedTask) {
      const newTask = { ...updatedTask, status: newStatus };
      setTasks(prev => prev.map(t => t.id === taskId ? newTask : t));
      // Persistir cambio de estado al cloud
      await workspace.executeAction('saveTask', newTask);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">{t.title}</h2>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateAIPlan}
            disabled={isGenerating}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:scale-105 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-xs shadow-lg shadow-blue-600/20"
          >
            {isGenerating ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div> :
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            }
            <span>Generar Plan Estratégico IA</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {columns.map((col) => {
          const columnTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="space-y-4" onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, col.id)}>
              <div className="flex justify-between items-center px-2">
                <h3 className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{col.title}</h3>
                <span className="text-[10px] text-slate-600 font-bold">{columnTasks.length}</span>
              </div>
              <div className="min-h-[500px] p-4 rounded-3xl bg-white/[0.02] border border-dashed border-white/10 space-y-4">
                {columnTasks.map((task) => (
                  <div key={task.id} draggable onDragStart={e => onDragStart(e, task.id)} className="glass p-5 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all cursor-grab active:cursor-grabbing">
                    <div className="flex justify-between mb-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{task.priority}</span>
                      <span className="text-[8px] text-slate-600">{task.assignee}</span>
                    </div>
                    <h4 className="text-white font-bold text-sm leading-snug">{task.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkPlan;
