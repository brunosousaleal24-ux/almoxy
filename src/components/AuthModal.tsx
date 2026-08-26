import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firebaseConfig } from '../lib/firebase';
import { BorgesGomesLogo } from './BorgesGomesLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    userProfile,
    loginWithEmail,
    logout,
    authError,
    updateUserProfileData,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'ALMOXARIFE' | 'OPERADOR' | 'AUDITOR'>('ALMOXARIFE');
  const [department, setDepartment] = useState('Almoxarifado Central');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    const ok = await loginWithEmail(email, password);
    setIsSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  // 2. Save Profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) return;
    setIsSubmitting(true);
    await updateUserProfileData({
      displayName,
      role,
      department,
    });
    setIsSubmitting(false);
    setSaveSuccessMessage('Perfil atualizado com sucesso!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#15191F] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2C3440] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#111418] via-[#1A1F26] to-[#111418] p-5 text-white border-b border-amber-500/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <BorgesGomesLogo size="sm" variant="image" />
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-white">
                {currentUser ? 'Perfil de Acesso • Borges & Gomes' : 'Borges & Gomes Engenharia'}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentUser ? 'Sessão Ativa no Almoxarifado' : 'Autenticação Segura Firebase'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Error Message Alert */}
          {authError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Falha na Autenticação:</span>
                <span>{authError}</span>
              </div>
            </div>
          )}

          {saveSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* LOGIN FORM (When Not Logged In) */}
          {!currentUser ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1A1F26] border border-slate-300 dark:border-[#2F3642] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1A1F26] border border-slate-300 dark:border-[#2F3642] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-amber-900/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* LOGGED IN USER PROFILE */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1B2028] border border-slate-200 dark:border-[#2A323E] flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white font-serif font-bold text-base flex items-center justify-center shadow-md">
                  {currentUser.displayName
                    ? currentUser.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'OP'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || 'Almoxarife'}
                    </h3>
                    <span className="px-2 py-0.5 text-[9px] rounded font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      {userProfile?.role || 'ALMOXARIFE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                    {currentUser.email}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    UID: {currentUser.uid.slice(0, 14)}...
                  </p>
                </div>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    value={displayName || currentUser.displayName || ''}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1F26] border border-slate-300 dark:border-[#2F3642] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cargo / Função
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#1A1F26] border border-slate-300 dark:border-[#2F3642] rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="ALMOXARIFE">Almoxarife</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="OPERADOR">Operador de Campo</option>
                      <option value="AUDITOR">Auditor de Estoque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Setor / Lotação
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#1A1F26] border border-slate-300 dark:border-[#2F3642] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md transition"
                  >
                    Salvar Alterações
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      onClose();
                    }}
                    className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-xl font-semibold flex items-center gap-1.5 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair (Logout)</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
