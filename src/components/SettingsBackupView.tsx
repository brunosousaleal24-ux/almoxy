import React, { useState, useRef } from 'react';
import {
  Cloud,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Clock,
  Settings as SettingsIcon,
  RotateCcw,
  Shield,
  FileJson,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatDate } from '../utils/exportUtils';

export const SettingsBackupView: React.FC = () => {
  const {
    settings,
    updateSettings,
    backupHistory,
    createCloudBackup,
    exportDatabaseJson,
    importDatabaseJson,
    resetToDefaults,
    isSyncing,
    lastSyncTime,
  } = useInventory();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleManualBackup = () => {
    createCloudBackup();
    setSuccessMessage('Backup em nuvem gerado com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJson(content);
      if (success) {
        setImportStatus('Banco de dados restaurado com sucesso!');
        setTimeout(() => setImportStatus(null), 3500);
      } else {
        setImportStatus('Erro ao importar arquivo. Verifique o formato JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-amber-500" />
            Backup em Nuvem & Configurações Globais
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Persistência segura, snapshots automáticos na nuvem, exportação/restauração em JSON e personalização corporativa.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-[#141B17] border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {importStatus && (
        <div className="p-3 bg-amber-50 dark:bg-[#1E1C15] border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-amber-500" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Main Grid: Backup Cloud + General Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Cloud Backup & Snapshots */}
        <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-amber-500" />
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-[#F9FAFB]">
                Backup Automático na Nuvem
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#141B17] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
              {settings.autoBackup ? 'ATIVO' : 'PAUSADO'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Os snapshots registram integralmente o histórico de movimentações fiscais, saldo de estoque, fornecedores e auditorias.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl">
              <div>
                <span className="font-serif font-bold text-xs text-slate-900 dark:text-white block">
                  Backup Automático Recorrente
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Gerar ponto de restauração periódico em segundo plano
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => updateSettings({ autoBackup: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Intervalo de Backup</label>
                <select
                  value={settings.backupIntervalHours}
                  onChange={(e) => updateSettings({ backupIntervalHours: Number(e.target.value) })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60"
                >
                  <option value={1}>A cada 1 hora</option>
                  <option value={4}>A cada 4 horas</option>
                  <option value={12}>A cada 12 horas</option>
                  <option value={24}>Diário (24 horas)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Última Sincronização</label>
                <div className="py-2 px-3 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {formatDate(lastSyncTime)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleManualBackup}
                disabled={isSyncing}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <Cloud className="w-4 h-4" />
                Criar Snapshot na Nuvem Agora
              </button>
            </div>
          </div>

          {/* Backup History Table */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#262B33] space-y-2">
            <h4 className="font-serif font-bold text-xs text-slate-900 dark:text-white">
              Histórico de Snapshots Recentes
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {backupHistory.map((bcp) => (
                <div
                  key={bcp.id}
                  className="p-2.5 bg-slate-50 dark:bg-[#1C2128] rounded-xl flex items-center justify-between text-xs border border-slate-200 dark:border-[#2D3540]"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <div>
                      <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(bcp.timestamp)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {bcp.totalProducts} produtos • {bcp.totalMovements} movimentações ({bcp.sizeKb} KB)
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-[#141B17] text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[9px] rounded border border-emerald-500/30">
                    CONCLUÍDO
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Manual Import/Export & Preferences */}
        <div className="space-y-6">
          {/* Export & Import Box */}
          <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2">
              <FileJson className="w-5 h-5 text-amber-500" />
              Backup Físico em Arquivo JSON
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Faça download de uma cópia física completa para migração de máquinas ou arquivamento de compliance.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={exportDatabaseJson}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2128] dark:hover:bg-[#252C36] text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#2D3540] transition"
              >
                <Download className="w-4 h-4 text-amber-500" />
                Exportar JSON
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2128] dark:hover:bg-[#252C36] text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#2D3540] transition"
              >
                <Upload className="w-4 h-4 text-amber-500" />
                Restaurar JSON
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          {/* Preferences Settings */}
          <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-amber-500" />
              Preferências & Identidade Corporativa
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Razão Social / Nome do Almoxarifado</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => updateSettings({ companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white font-serif font-bold focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Modo Noturno (Tema)</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => updateSettings({ theme: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="light">☀️ Modo Editorial Claro</option>
                    <option value="dark">🌙 Modo Editorial Noturno</option>
                    <option value="system">🖥️ Seguir Sistema Operacional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Galpão Padrão</label>
                  <input
                    type="text"
                    value={settings.defaultWarehouse}
                    onChange={(e) => updateSettings({ defaultWarehouse: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>
            </div>

            {/* Reset Defaults button */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#262B33] flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm('Deseja redefinir todos os dados para a amostra padrão de Borges e Gomes?')) {
                    resetToDefaults();
                  }
                }}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Redefinir Dados de Exemplo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
