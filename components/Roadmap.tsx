
import React from 'react';
import { Language, translations } from '../translations';

interface RoadmapProps {
  language: Language;
}

const Roadmap: React.FC<RoadmapProps> = ({ language }) => {
  const t = translations[language].roadmap;

  const blindSpots = language === 'es' ? [
    { title: "Cumplimiento Legal y TOS", desc: "El scraping directo viola términos de servicio. Usar APIs intermedias o datos públicos de SEO es la solución profesional." },
    { title: "Shadow Bans y Límites", desc: "Las redes tienen límites estrictos. Se deben usar proxies y patrones de navegación humana." },
    { title: "Precisión de Datos", desc: "Los CEOs cambian. Necesitamos verificación de posts recientes de LinkedIn." },
    { title: "Alucinaciones de IA", desc: "La IA puede inventar emails. El grounding con resultados reales de búsqueda es obligatorio." }
  ] : [
    { title: "Legal & TOS Compliance", desc: "Directly scraping Instagram/Facebook violates their Terms of Service. Using middle-man APIs or public SEO data is the professional workaround." },
    { title: "Shadow Bans & Rate Limits", desc: "Social platforms have strict limits. We must use proxy rotation and 'human-like' browsing patterns." },
    { title: "Data Accuracy", desc: "CEOs change often. We need a 'Last Verified' timestamp and Gemini-powered verification of recent posts." },
    { title: "AI Hallucinations", desc: "Gemini might invent an email. Grounding with actual search results is mandatory." }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-bold mb-2 text-white">{t.title}</h2>
        <p className="text-slate-400">{t.subtitle}</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {t.phases.map((phase, idx) => (
          <div key={idx} className="glass p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all">
            <h3 className="text-blue-400 font-bold mb-4">{phase.title}</h3>
            <ul className="space-y-3">
              {phase.items.map((item, i) => (
                <li key={i} className="flex items-start space-x-2 text-sm text-slate-300">
                  <span className="text-blue-500 mt-1">●</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-3xl">
        <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {t.analysis}
        </h3>
        <div className="grid md:grid-cols-2 gap-8">
          {blindSpots.map((spot, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="font-semibold text-white">{spot.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{spot.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Roadmap;
