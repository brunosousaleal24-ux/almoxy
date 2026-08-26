import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  ArrowDownRight,
  Download,
  CheckCircle,
  Bell,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, exportLowStockReportPDF } from '../utils/exportUtils';
import { Product } from '../types';

interface AlertsViewProps {
  onOpenMovementModal: (product: Product, type: 'ENTRADA') => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ onOpenMovementModal }) => {
  const { alerts, products, settings, updateSettings, dismissAlert } = useInventory();

  const criticalAlerts = alerts.filter((a) => a.type === 'CRITICO');
  const lowStockAlerts = alerts.filter((a) => a.type === 'BAIXO');
  const expiringAlerts = alerts.filter((a) => a.type === 'VENCIMENTO_PROXIMO');

  const totalEstimatedCost = alerts.reduce((acc, a) => acc + a.estimatedCost, 0);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-500" />
            Sistema de Alertas & Notificações Inteligentes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoramento preventivo de nível de estoque, pontos de reposição e faltas de insumos críticos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 border transition ${
              settings.soundAlerts
                ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1C2128] dark:text-slate-400 dark:border-[#2D3540]'
            }`}
          >
            {settings.soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Alertas Sonoros: {settings.soundAlerts ? 'Ativos' : 'Mudos'}</span>
          </button>

          {/* Export Low Stock PDF */}
          <button
            onClick={() => exportLowStockReportPDF(alerts, products, settings.companyName)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Relatório de Reposição (PDF)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 dark:bg-[#1C1618] border border-red-200 dark:border-red-900/50 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-red-800 dark:text-red-300">
              Rupturas Imediatas (0 un)
            </span>
            <AlertOctagon className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-red-700 dark:text-red-400 mt-2">
            {criticalAlerts.length} itens zerados
          </div>
          <span className="text-[11px] text-red-600 dark:text-red-400/80">
            Requer compra ou transferência emergencial
          </span>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-[#1E1C15] border border-amber-200 dark:border-amber-900/50 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-amber-800 dark:text-amber-300">
              Abaixo do Estoque Mínimo
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-700 dark:text-amber-400 mt-2">
            {lowStockAlerts.length} itens em ponto de pedido
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400/80">
            Atingiram a margem de segurança
          </span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-[#16191D] border border-slate-200 dark:border-[#2C333E] rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-slate-800 dark:text-slate-300">
              Orçamento de Reposição
            </span>
            <span className="text-xs font-mono font-bold text-amber-500">Recomendado</span>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-[#F3F4F6] mt-2">
            {formatCurrency(totalEstimatedCost)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Valor estimado para reestabelecer o Estoque Máximo
          </span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl flex flex-col items-center gap-3">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
            <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
              Nenhum Alerta Ativo
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Todos os materiais e equipamentos do almoxarifado Borges & Gomes estão dentro dos parâmetros ideais de estoque.
            </p>
          </div>
        ) : (
          alerts.map((alt) => {
            const prod = products.find((p) => p.id === alt.productId);
            const isCritical = alt.type === 'CRITICO';

            return (
              <div
                key={alt.id}
                className={`p-4 rounded-2xl border transition shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCritical
                    ? 'bg-red-50/70 dark:bg-[#1B1417] border-red-200 dark:border-red-900/60'
                    : 'bg-white dark:bg-[#16191D] border-slate-200 dark:border-[#262B33]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                      isCritical
                        ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                        : alt.type === 'VENCIMENTO_PROXIMO'
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {isCritical ? (
                      <AlertOctagon className="w-5 h-5" />
                    ) : alt.type === 'VENCIMENTO_PROXIMO' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-slate-900 dark:text-[#F9FAFB]">
                        {alt.productName}
                      </span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1C2128] text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-[#2D3540]">
                        {alt.productSku}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {alt.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                      <span>Saldo Atual: <strong className={isCritical ? 'text-red-500 font-mono' : 'text-amber-500 font-mono'}>{alt.currentStock}</strong></span>
                      <span>•</span>
                      <span>Mínimo Recomendado: <strong className="text-slate-700 dark:text-slate-300 font-mono">{alt.minStock}</strong></span>
                      {alt.suggestedReorderQuantity > 0 && (
                        <>
                          <span>•</span>
                          <span>Comprar: <strong className="text-amber-500 font-mono">+{alt.suggestedReorderQuantity} un</strong> ({formatCurrency(alt.estimatedCost)})</span>
                        </>
                      )}
                      {prod && (
                        <>
                          <span>•</span>
                          <span>Fornecedor: <strong className="text-slate-700 dark:text-slate-300">{prod.supplierName}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => dismissAlert(alt.id)}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Dispensar
                  </button>

                  {prod && (
                    <button
                      onClick={() => onOpenMovementModal(prod, 'ENTRADA')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      Repor Estoque (+ NF)
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
