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
  Building2,
  Wrench,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { BorgesGomesLogo } from './BorgesGomesLogo';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'dashboard'
  | 'inventory'
  | 'movements'
  | 'cautions'
  | 'construction-sites'
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
    <header className="sticky top-0 z-30 bg-[#090D17]/95 backdrop-blur-xl border-b border-amber-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors">
      {/* Top Command Navbar */}
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-15 gap-2 sm:gap-3">
          {/* Logo & Brand Borges & Gomes with Command Accent */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            onClick={() => setActiveTab('dashboard')}
          >
            <BorgesGomesLogo size="sm" showSubtitle={true} />
            <div className="hidden 2xl:flex items-center gap-1.5 pl-3 border-l border-amber-500/30">
              <span className="brand-badge-gold text-[9px]">CENTRO DE COMANDO</span>
            </div>
          </div>

          {/* Quick Actions & Status Indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Online / Offline Sync Badge */}
            <div className="flex items-center">
              {isOnline ? (
                <button
                  id="btn-sync-status-indicator"
                  onClick={() => syncNow()}
                  disabled={isSyncing}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition cursor-pointer ${
                    pendingSyncCount > 0
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-[#0E1B15] text-emerald-300 border-emerald-500/40 shadow-sm'
                  }`}
                  title={isSyncing ? 'Sincronizando...' : 'Online - Clique para sincronizar agora'}
                >
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline font-mono font-medium text-[11px]">
                    {isSyncing ? 'Sincronizando...' : pendingSyncCount > 0 ? `${pendingSyncCount} pendentes` : 'Cloud Sync'}
                  </span>
                  {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />}
                </button>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-[#1B1714] text-amber-300 border border-amber-700/60 font-mono text-[11px]"
                  title="Modo Offline ativo."
                >
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Offline</span>
                </div>
              )}
            </div>

            {/* Barcode Scanner Trigger Button */}
            <button
              id="btn-open-scanner-header"
              onClick={onOpenScanner}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#111827] hover:bg-[#1A2337] text-amber-300 border border-amber-500/35 transition shadow-sm cursor-pointer"
              title="Abrir Leitor de Código de Barras por Câmera ou Teclado"
            >
              <Barcode className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline font-medium">Bipar</span>
            </button>

            {/* Quick Movement Button */}
            <button
              id="btn-quick-movement-header"
              onClick={onOpenMovementModal}
              className="brand-gradient-btn flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-md cursor-pointer"
              title="Registrar Entrada ou Saída no Estoque"
            >
              <PlusCircle className="w-4 h-4 text-slate-950 shrink-0" />
              <span className="hidden sm:inline text-slate-950 font-bold">Movimentação</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-[#111827] text-slate-300 hover:text-white hover:bg-[#1A2337] transition border border-slate-700/60 hover:border-amber-500/40 cursor-pointer"
                title="Alertas de Estoque e Notificações"
              >
                <Bell className="w-4 h-4 text-amber-400/90" />
                {alerts.length > 0 && (
                  <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${criticalAlerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0D131F] border border-amber-500/30 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in backdrop-blur-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-serif font-bold text-sm text-white">
                        Notificações do Almoxarifado
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                      {alerts.length} alertas
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 mt-2">
                    {alerts.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
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
                              <span className="font-serif font-semibold text-xs text-white">
                                {alt.productName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {alt.message}
                            </p>
                            {alt.suggestedReorderQuantity > 0 && (
                              <span className="inline-block mt-1 text-[10px] text-amber-300 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                                Sugestão compra: +{alt.suggestedReorderQuantity} un
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => dismissAlert(alt.id)}
                            className="text-[10px] uppercase font-mono tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            Dispensar
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setActiveTab('alerts');
                      }}
                      className="text-xs font-serif font-bold text-amber-400 hover:underline cursor-pointer"
                    >
                      Ver Painel Completo de Alertas →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle Button */}
            <button
              id="btn-toggle-theme"
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#111827] hover:bg-[#1A2337] text-amber-300 transition border border-amber-500/30 shadow-sm active:scale-95 cursor-pointer select-none"
              title={settings.theme === 'dark' ? 'Modo Centro de Comando Dark Gold' : 'Alternar Tema'}
            >
              <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline text-xs font-semibold font-serif text-amber-300">Dark Gold</span>
            </button>

            {/* Firebase Auth User Profile Dropdown / Login Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="btn-user-profile-toggle"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-[#111827] hover:bg-[#1A2337] border border-amber-500/30 transition shadow-sm cursor-pointer"
                  title="Perfil e Autenticação Firebase"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-serif font-black text-xs flex items-center justify-center shadow-md">
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-[11px] font-bold font-serif text-white leading-tight max-w-[100px] truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </div>
                    <div className="text-[9px] text-amber-400 font-mono">
                      {userProfile?.role || 'Comandante'}
                    </div>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0D131F] border border-amber-500/30 rounded-2xl shadow-2xl p-3 z-50 animate-fade-in backdrop-blur-xl">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-serif font-black text-sm flex items-center justify-center shadow-md">
                        {initials}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-serif font-bold text-xs text-white truncate">
                          {currentUser.displayName || 'Operador'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          {currentUser.email}
                        </div>
                        <div className="text-[9px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Firebase Auth Conectado
                        </div>
                      </div>
                    </div>

                    <div className="py-2 space-y-1 text-xs">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuthModal();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-[#161F2E] transition flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>Gerenciar Meu Perfil</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('settings');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-[#161F2E] transition flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Status da Conexão Nuvem</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={async () => {
                          setShowUserMenu(false);
                          await logout();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition flex items-center gap-2 text-xs font-semibold cursor-pointer"
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
                className="brand-gradient-btn flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm active:scale-95 cursor-pointer"
                title="Acessar com E-mail e Senha Firebase"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-950" />
                <span className="text-slate-950 font-bold">Entrar (Login)</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Navigation Tabs Bar - Proporcional e Ajustado para Todos os Itens */}
        <nav className="flex items-center justify-start xl:justify-end gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-2 border-t border-amber-500/20 text-[11px] 2xl:text-xs w-full">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Estoque</span>
          </button>

          <button
            id="nav-tab-movements"
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'movements'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Movimentações</span>
          </button>

          <button
            id="nav-tab-cautions"
            onClick={() => setActiveTab('cautions')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'cautions'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Cautelas & Ferramentas</span>
          </button>

          <button
            id="nav-tab-construction-sites"
            onClick={() => setActiveTab('construction-sites')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'construction-sites'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Obras & Canteiros</span>
          </button>

          <button
            id="nav-tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Relatórios & BI</span>
          </button>

          <button
            id="nav-tab-alerts"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'alerts'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Alertas</span>
            {alerts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] rounded font-bold font-mono">
                {alerts.length}
              </span>
            )}
          </button>

          <button
            id="nav-tab-suppliers"
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'suppliers'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Fornecedores</span>
          </button>

          <button
            id="nav-tab-knowledge"
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'knowledge'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Base de Conhecimento</span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3 2xl:py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/60 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-[#131B2A] border border-transparent'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Nuvem & Backup</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
