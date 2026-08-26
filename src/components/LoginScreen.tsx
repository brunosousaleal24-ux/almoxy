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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firebaseConfig } from '../lib/firebase';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, authError } = useAuth();

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

  return (
    <div className="min-h-screen w-full bg-[#0E1114] text-[#E5E7EB] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Decorative Gradients & Mesh */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#22272E_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-900/30">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-lg tracking-wider text-white">
                ALMOXARIFADO
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                SISTEMA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Controle Integrado de Estoque, Ferramentas & Cautelas
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161A20] border border-[#2B3340] text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Acesso Seguro Firebase</span>
        </div>
      </header>

      {/* Main Center Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[#16191E] border border-[#29313D] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in backdrop-blur-md">
          {/* Card Top Title Banner */}
          <div className="p-6 bg-gradient-to-b from-[#1E232B] to-[#16191E] border-b border-[#29313D] text-center relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-inner">
              <LockKeyhole className="w-6 h-6" />
            </div>
            <h2 className="font-serif font-bold text-xl text-white">
              Acesso ao Almoxarifado
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Informe suas credenciais autorizadas para entrar no sistema.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {/* Error Message Alert */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 animate-shake">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#111317] border border-[#2B3441] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#111317] border border-[#2B3441] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
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
          <div className="p-4 bg-[#111317] border-t border-[#232832] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Autenticação Firebase</span>
            </div>
            <span>Segurança Ativa</span>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-400 font-mono">
        © {new Date().getFullYear()} Sistema de Almoxarifado & Controle de Estoque. Acesso restrito a colaboradores autorizados.
      </footer>
    </div>
  );
};
