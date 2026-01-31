
import React, { useState, useEffect } from 'react';
import { Language, translations } from '../translations';
import { quotaService } from '../services/quotaService';

interface SystemLimitsProps {
  language: Language;
}

const SystemLimits: React.FC<SystemLimitsProps> = ({ language }) => {
  const t = translations[language].limits;
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

  const renderQuotaBar = (current: number, total: number, color: string) => {
    const percentage = Math.min(100, (current / total) * 100);
    return (
      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
        <div 
          className={`h-full bg-${color}-500 transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header>
        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">{t.title}</h2>
        <p className="text-slate-400">{t.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gemini Flash Card */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-6">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              {t.aiSection} - Flash
            </h3>
            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${quotas.flash.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {quotas.flash.isBlocked ? `Bloqueado (${quotas.flash.nextAvailableIn}s)` : 'Operativo'}
            </span>
          </div>
          
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-6">
            <h4 className="text-lg font-bold text-blue-400">Gemini 3 Flash</h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-1">
                  <span>{t.rpm}</span>
                  <span className={quotas.flash.rpmLeft < 3 ? 'text-red-400' : 'text-white'}>{quotas.flash.rpmLeft} / {quotas.flash.rpmTotal}</span>
                </div>
                {renderQuotaBar(quotas.flash.rpmLeft, quotas.flash.rpmTotal, 'blue')}
              </div>
              
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-1">
                  <span>{t.rpd}</span>
                  <span className="text-white">{quotas.flash.rpdLeft} / {quotas.flash.rpdTotal}</span>
                </div>
                {renderQuotaBar(quotas.flash.rpdLeft, quotas.flash.rpdTotal, 'blue')}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-4">
              <span className="font-bold text-slate-500 mr-1">Uso:</span> Prospección masiva y Chatbots.
            </p>
          </div>
        </div>

        {/* Gemini Pro Card */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-6">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
              {t.aiSection} - Pro
            </h3>
            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${quotas.pro.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {quotas.pro.isBlocked ? `Bloqueado (${quotas.pro.nextAvailableIn}s)` : 'Operativo'}
            </span>
          </div>
          
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-6">
            <h4 className="text-lg font-bold text-purple-400">Gemini 3 Pro</h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-1">
                  <span>{t.rpm}</span>
                  <span className={quotas.pro.rpmLeft < 1 ? 'text-red-400' : 'text-white'}>{quotas.pro.rpmLeft} / {quotas.pro.rpmTotal}</span>
                </div>
                {renderQuotaBar(quotas.pro.rpmLeft, quotas.pro.rpmTotal, 'purple')}
              </div>
              
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-1">
                  <span>{t.rpd}</span>
                  <span className="text-white">{quotas.pro.rpdLeft} / {quotas.pro.rpdTotal}</span>
                </div>
                {renderQuotaBar(quotas.pro.rpdLeft, quotas.pro.rpdTotal, 'purple')}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-4">
              <span className="font-bold text-slate-500 mr-1">Uso:</span> Análisis crítico e investigación profunda.
            </p>
          </div>
        </div>
      </div>

      <section className="glass p-8 rounded-[3rem] border border-amber-500/20 bg-amber-500/5">
        <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth={2}/></svg>
          Seguridad de Cuotas y Prevención de Bloqueos
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="text-white font-bold text-sm">Bloqueo Preventivo</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Los botones de acción se deshabilitan automáticamente cuando restan menos de 2 peticiones por minuto. Esto evita que tu cuenta sea baneada temporalmente por Google.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-bold text-sm">Contadores Locales</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tus consultas se registran localmente en el navegador para darte una estimación exacta de cuántas respuestas te quedan antes de que el sistema te pida esperar.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-bold text-sm">Refresco Automático</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tan pronto como pase el tiempo de enfriamiento (60 segundos), el sistema desbloqueará las capacidades de IA automáticamente.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SystemLimits;
