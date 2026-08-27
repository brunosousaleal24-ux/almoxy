import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sun,
  Moon,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { BorgesGomesLogo } from './BorgesGomesLogo';
import bgWallpaper from '../assets/images/borges_gomes_logo_1787780217918.jpg';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, authError } = useAuth();
  const { settings, toggleTheme } = useInventory();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    await loginWithEmail(email, password);
    setIsSubmitting(false);
  };

  const isDarkMode = settings.theme === 'dark';

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-700 dark:selection:text-amber-200">
      {/* Background Image Wallpaper with Executive Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgWallpaper}
          alt="Borges & Gomes Engenharia Background"
          className="w-full h-full object-cover object-center scale-105 transform animate-pulse duration-10000"
          referrerPolicy="no-referrer"
        />
        {/* Deep Slate / Charcoal Overlay for Contrast & Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080D16]/85 via-[#0A101C]/80 to-[#060911]/95 backdrop-blur-sm" />
        {/* Subtle Gold Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="bg-[#0D131F]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/30 shadow-lg">
          <BorgesGomesLogo size="md" showSubtitle={true} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Theme Switcher */}
          <button
            id="btn-login-toggle-theme"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D131F]/85 backdrop-blur-md border border-amber-500/30 text-xs font-semibold text-slate-200 hover:bg-[#161F2E] shadow-sm transition active:scale-95 cursor-pointer"
            title={isDarkMode ? 'Mudar para Modo Dia (Claro)' : 'Mudar para Modo Escuro (Noturno)'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-mono">Modo Escuro (🌙)</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-300" />
                <span className="text-[11px] font-mono">Modo Dia (☀️)</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D131F]/85 backdrop-blur-md border border-slate-700 text-xs font-mono text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Acesso Seguro Firebase</span>
          </div>
        </div>
      </header>

      {/* Main Center Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[#0D131F]/90 backdrop-blur-xl border border-amber-500/40 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col animate-fade-in">
          {/* Card Top Title Banner with Official Logo */}
          <div className="p-6 bg-gradient-to-b from-[#141C2B]/90 to-[#0E1522]/90 border-b border-amber-500/20 text-center relative flex flex-col items-center">
            <div className="mb-3 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-amber-400 rounded-2xl blur-xs opacity-70 group-hover:opacity-100 transition duration-300" />
              <BorgesGomesLogo size="lg" variant="image" className="relative" />
            </div>
            <div className="flex items-center gap-1.5 justify-center mb-1">
              <span className="brand-badge-gold">PORTAL CORPORATIVO</span>
            </div>
            <h2 className="font-serif font-bold text-xl text-white tracking-wide">
              Borges & Gomes Engenharia
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistema Integrado de Almoxarifado, Cautelas & Obras
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {/* Error Message Alert */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <div className="flex-1">
                  <strong className="block font-bold text-red-300">Falha de Autenticação:</strong>
                  <span>{authError}</span>
                </div>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail do Colaborador *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/80" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@borgesegomes.com.br"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#080D16]/90 border border-slate-700 focus:border-amber-500 rounded-xl text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/80" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#080D16]/90 border border-slate-700 focus:border-amber-500 rounded-xl text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isSubmitting}
                className="brand-gradient-btn w-full py-3 text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-900/40 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Validando credenciais...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Card Info */}
          <div className="p-4 bg-[#080D16]/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Autenticação Firebase Firestore</span>
            </div>
            <span className="text-emerald-400">Protegido SSL</span>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-400 font-mono">
        © {new Date().getFullYear()} Borges & Gomes Engenharia. Todos os direitos reservados. Acesso restrito a colaboradores autorizados.
      </footer>
    </div>
  );
};
