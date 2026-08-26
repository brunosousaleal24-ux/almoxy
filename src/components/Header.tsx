import React, { useState } from 'react';
import {
  Package,
  Layers,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  Barcode,
  PlusCircle,
  BookOpen,
  Truck,
  Settings,
  AlertTriangle,
  CheckCircle2,
  User,
  ShieldCheck,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { BorgesGomesLogo } from './BorgesGomesLogo';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'dashboard'
  | 'inventory'
  | 'movements'
  | 'reports'
  | 'alerts'
  | 'suppliers'
  | 'knowledge'
  | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
  onOpenMovementModal: () => void;
  onOpenProductModal: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  onOpenMovementModal,
  onOpenProductModal,
  onOpenAuthModal,
}) => {
  const {
    settings,
    toggleTheme,
    isOnline,
    isSyncing,
    pendingSyncCount,
    syncNow,
    alerts,
    dismissAlert,
  } = useInventory();

  const { currentUser, userProfile, logout } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const criticalAlerts = alerts.filter((a) => a.severity === 'high');

  const initials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : currentUser?.email?.slice(0, 2).toUpperCase() || 'OP';

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/95 dark:bg-[#121519]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#22272E] transition-colors">
      {/* Top Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand Borges & Gomes */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <BorgesGomesLogo size="md" showSubtitle={true} />
          </div>

          {/* Quick Actions & Status Indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online / Offline Sync Badge */}
            <div className="flex items-center">
              {isOnline ? (
                <button
                  id="btn-sync-status-indicator"
                  onClick={() => syncNow()}
                  disabled={isSyncing}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition ${
                    pendingSyncCount > 0
                      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                  }`}
                  title={isSyncing ? 'Sincronizando...' : 'Online - Clique para sincronizar agora'}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden md:inline font-mono font-medium text-[11px]">
                    {isSyncing ? 'Sincronizando...' : pendingSyncCount > 0 ? `${pendingSyncCount} pendentes` : 'Online & Sync'}
                  </span>
                  {isSyncing && <RefreshCw className="w-3 h-3 animate-spin" />}
                </button>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-slate-200 text-slate-700 dark:bg-[#1E232A] dark:text-slate-300 border border-slate-300 dark:border-[#2D3440] font-mono text-[11px]"
                  title="Modo Offline ativo. As movimentações serão salvas localmente e sincronizadas quando a conexão retornar."
                >
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Offline Local</span>
                </div>
              )}
            </div>

            {/* Barcode Scanner Trigger Button */}
            <button
              id="btn-open-scanner-header"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#18202C] dark:hover:bg-[#202B3B] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#28354A] transition shadow-sm"
              title="Abrir Leitor de Código de Barras por Câmera ou Teclado"
            >
              <Barcode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline font-medium">Bipar Código</span>
            </button>

            {/* Quick Movement Button */}
            <button
              id="btn-quick-movement-header"
              onClick={onOpenMovementModal}
              className="brand-gradient-btn flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-md"
              title="Registrar Entrada ou Saída no Estoque"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Movimentação</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C2128] transition border border-transparent dark:hover:border-[#2C323C]"
                title="Alertas de Estoque e Notificações"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${criticalAlerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#282E37] rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#232830]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="font-serif font-bold text-sm text-slate-900 dark:text-white">
                        Notificações do Almoxarifado
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-100 dark:bg-[#20252D] px-2 py-0.5 rounded font-bold text-slate-600 dark:text-slate-300">
                      {alerts.length} alertas
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-[#232830] mt-2">
                    {alerts.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span>Nenhum alerta crítico no momento! Todos os níveis de estoque estão regulares.</span>
                      </div>
                    ) : (
                      alerts.map((alt) => (
                        <div key={alt.id} className="py-2.5 flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  alt.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'
                                }`}
                              />
                              <span className="font-serif font-semibold text-xs text-slate-900 dark:text-white">
                                {alt.productName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {alt.message}
                            </p>
                            {alt.suggestedReorderQuantity > 0 && (
                              <span className="inline-block mt-1 text-[10px] text-amber-700 dark:text-amber-300 font-mono font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
                                Sugestão compra: +{alt.suggestedReorderQuantity} un
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => dismissAlert(alt.id)}
                            className="text-[10px] uppercase font-mono tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            Dispensar
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#232830] flex justify-end">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setActiveTab('alerts');
                      }}
                      className="text-xs font-serif font-bold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      Ver Painel Completo de Alertas →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle Button (Modo Dia / Modo Noite) */}
            <button
              id="btn-toggle-theme"
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1A1E24] hover:bg-slate-200 dark:hover:bg-[#242A33] text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-[#2C333E] shadow-sm active:scale-95 cursor-pointer select-none"
              title={settings.theme === 'dark' ? 'Clique para mudar para Modo Dia (Claro)' : 'Clique para mudar para Modo Noite (Escuro)'}
            >
              {settings.theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline text-xs font-semibold font-serif text-amber-300">Modo Noite</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline text-xs font-semibold font-serif text-slate-700">Modo Dia</span>
                </>
              )}
            </button>

            {/* Firebase Auth User Profile Dropdown / Login Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="btn-user-profile-toggle"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#191D23] hover:bg-slate-200 dark:hover:bg-[#222830] border border-slate-200 dark:border-[#2A313C] transition shadow-sm"
                  title="Perfil e Autenticação Firebase"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white font-serif font-bold text-xs flex items-center justify-center shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-[11px] font-bold font-serif text-slate-900 dark:text-white leading-tight max-w-[100px] truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </div>
                    <div className="text-[9px] text-amber-600 dark:text-amber-400 font-mono">
                      {userProfile?.role || 'Almoxarife'}
                    </div>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#282E37] rounded-xl shadow-2xl p-3 z-50 animate-fade-in">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-[#232830]">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-serif font-bold text-sm flex items-center justify-center shadow-md">
                        {initials}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-serif font-bold text-xs text-slate-900 dark:text-white truncate">
                          {currentUser.displayName || 'Operador'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                          {currentUser.email}
                        </div>
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Firebase Auth Ativo
                        </div>
                      </div>
                    </div>

                    <div className="py-2 space-y-1 text-xs">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuthModal();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20252D] transition flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        <span>Gerenciar Meu Perfil</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('settings');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20252D] transition flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Status da Conexão Nuvem</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-[#232830]">
                      <button
                        onClick={async () => {
                          setShowUserMenu(false);
                          await logout();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition flex items-center gap-2 text-xs font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair da Conta (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-open-login"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 transition shadow-sm active:scale-95"
                title="Acessar com E-mail e Senha Firebase"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar (Login)</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Navigation Tabs Bar */}
        <nav className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-2.5 border-t border-slate-100 dark:border-[#1E2634] text-xs">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#0E1726] text-amber-400 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202C]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Dashboard & Tendências
          </button>

          <button
            id="nav-tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-[#0E1726] text-amber-400 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202C]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Estoque & Produtos
          </button>

          <button
            id="nav-tab-movements"
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'movements'
                ? 'bg-[#0E1726] text-amber-400 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202C]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Movimentações Diárias
          </button>

          <button
            id="nav-tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#0E1726] text-amber-400 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202C]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Relatórios & BI
          </button>

          <button
            id="nav-tab-alerts"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-[#0E1726] text-amber-400 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202C]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Alertas de Reposição
            {alerts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] rounded font-bold font-mono">
                {alerts.length}
              </span>
            )}
          </button>

          <button
            id="nav-tab-suppliers"
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-[#0E1726] text-amber-400 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202C]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Fornecedores
          </button>

          <button
            id="nav-tab-knowledge"
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-[#0E1726] text-amber-400 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202C]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Base de Conhecimento
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#0E1726] text-amber-400 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202C]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Nuvem & Backup
          </button>
        </nav>
      </div>
    </header>
  );
};
