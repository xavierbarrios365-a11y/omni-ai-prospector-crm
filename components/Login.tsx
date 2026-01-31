
import React, { useState } from 'react';
import { Language, translations } from '../translations';

interface LoginProps {
  onLogin: (user: any) => void;
  language: Language;
  setLanguage: (l: Language) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, language, setLanguage }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const t = translations[language].login;

  const handleGoogleLogin = () => {
    if (!acceptedTerms) {
      alert(language === 'es' ? "Debe aceptar los términos legales para continuar." : "You must accept the legal terms to continue.");
      return;
    }
    setIsLoggingIn(true);
    setTimeout(() => {
      onLogin({
        name: 'Manager User',
        email: 'manager@gmail.com',
        avatar: 'M'
      });
      setIsLoggingIn(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-[#070708] flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      
      <div className="glass w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10 text-center">
        <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-emerald-600">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2}/></svg>
        </div>

        <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Omni AI</h1>
        <h2 className="text-xl font-bold text-white mb-4">{t.title}</h2>
        <p className="text-slate-400 text-sm mb-10">{t.subtitle}</p>

        <div className="mb-8 flex items-start space-x-3 text-left">
          <input 
            type="checkbox" 
            checked={acceptedTerms} 
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600"
          />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.terms}</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-slate-200 transition-all disabled:opacity-50"
        >
          {isLoggingIn ? (
            <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
          ) : (
            <span>{t.button}</span>
          )}
        </button>

        <div className="mt-10 flex items-center justify-center space-x-4">
          <button onClick={() => setLanguage('en')} className={`text-xs font-bold ${language === 'en' ? 'text-blue-400' : 'text-slate-600'}`}>ENGLISH</button>
          <button onClick={() => setLanguage('es')} className={`text-xs font-bold ${language === 'es' ? 'text-blue-400' : 'text-slate-600'}`}>ESPAÑOL</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
