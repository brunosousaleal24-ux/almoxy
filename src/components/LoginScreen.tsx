import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Boxes,
  LockKeyhole,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { BorgesGomesLogo } from './BorgesGomesLogo';

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
    <div className="min-h-screen w-full bg-[#F5F6F8] dark:bg-[#0E1114] text-slate-800 dark:text-[#E5E7EB] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-700 dark:selection:text-amber-200 transition-colors duration-200">
      {/* Background Decorative Gradients & Mesh */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] dark:bg-[radial-gradient(#22272E_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <BorgesGomesLogo size="md" showSubtitle={true} />

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Theme Switcher (Modo Dia / Modo Escuro) */}
          <button
            id="btn-login-toggle-theme"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161A20] border border-slate-300 dark:border-[#2B3340] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202630] shadow-sm transition active:scale-95"
            title={isDarkMode ? 'Mudar para Modo Dia (Claro)' : 'Mudar para Modo Escuro (Noturno)'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-mono">Modo Escuro (🌙)</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="text-[11px] font-mono">Modo Dia (☀️)</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#161A20] border border-slate-200 dark:border-[#2B3340] text-xs font-mono text-slate-600 dark:text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Acesso Seguro Firebase</span>
          </div>
        </div>
      </header>

      {/* Main Center Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-[#16191E] border border-slate-200 dark:border-[#29313D] rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden flex flex-col animate-fade-in backdrop-blur-md">
          {/* Card Top Title Banner with Official Logo */}
          <div className="p-6 bg-slate-50 dark:bg-gradient-to-b dark:from-[#1E232B] dark:to-[#16191E] border-b border-slate-200 dark:border-[#29313D] text-center relative flex flex-col items-center">
            <div className="mb-3">
              <BorgesGomesLogo size="lg" variant="image" />
            </div>
            <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white">
              Borges & Gomes Engenharia
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Portal de Acesso ao Sistema de Almoxarifado
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {/* Error Message Alert */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
                <div className="flex-1">
                  <strong className="block font-bold text-red-800 dark:text-red-300">Falha de Autenticação:</strong>
                  <span>{authError}</span>
                </div>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#111317] border border-slate-300 dark:border-[#2B3441] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Senha *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#111317] border border-slate-300 dark:border-[#2B3441] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-900/30 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
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
          <div className="p-4 bg-slate-50 dark:bg-[#111317] border-t border-slate-200 dark:border-[#232832] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Autenticação Firebase</span>
            </div>
            <span>Segurança Ativa</span>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
        © {new Date().getFullYear()} Sistema de Almoxarifado & Controle de Estoque. Acesso restrito a colaboradores autorizados.
      </footer>
    </div>
  );
};
