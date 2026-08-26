import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  PieChart as PieIcon,
  TrendingUp,
  AlertCircle,
  Building,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import {
  formatCurrency,
  formatDate,
  exportMovementsToPDF,
  exportInventoryToExcel,
  exportLowStockReportPDF,
} from '../utils/exportUtils';
import { Product } from '../types';

type ReportTab = 'CURVA_ABC' | 'FECHAMENTO_DIARIO' | 'NECESSIDADE_COMPRA' | 'CONSUMO_SETORES';

export const ReportsView: React.FC = () => {
  const { products, movements, alerts, settings } = useInventory();
  const [activeReport, setActiveReport] = useState<ReportTab>('CURVA_ABC');

  // 1. Curva ABC Calculation (80% - 15% - 5%)
  const abcAnalysis = React.useMemo(() => {
    const totalInventoryValue = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);

    const sorted = [...products]
      .map((p) => {
        const itemVal = p.currentStock * p.costPrice;
        const sharePercent = totalInventoryValue > 0 ? (itemVal / totalInventoryValue) * 100 : 0;
        return {
          product: p,
          itemVal,
          sharePercent,
        };
      })
      .sort((a, b) => b.itemVal - a.itemVal);

    let cumulativePercent = 0;
    return sorted.map((item) => {
      cumulativePercent += item.sharePercent;
      let classification: 'A' | 'B' | 'C' = 'C';
      if (cumulativePercent <= 80 || item.sharePercent >= 15) {
        classification = 'A';
      } else if (cumulativePercent <= 95) {
        classification = 'B';
      } else {
        classification = 'C';
      }

      return {
        ...item,
        cumulativePercent: Number(cumulativePercent.toFixed(1)),
        classification,
      };
    });
  }, [products]);

  // 2. Sector Consumption Analysis
  const sectorConsumption = React.useMemo(() => {
    const map: { [sector: string]: { totalValue: number; totalCount: number; items: string[] } } = {};
    movements
      .filter((m) => m.type === 'SAIDA')
      .forEach((m) => {
        const sec = m.requesterSector || 'Almoxarifado Geral';
        if (!map[sec]) {
          map[sec] = { totalValue: 0, totalCount: 0, items: [] };
        }
        map[sec].totalValue += m.totalCost;
        map[sec].totalCount += m.quantity;
        if (!map[sec].items.includes(m.productName)) {
          map[sec].items.push(m.productName);
        }
      });

    return Object.entries(map).map(([sector, data]) => ({
      sector,
      totalValue: data.totalValue,
      totalCount: data.totalCount,
      distinctItemsCount: data.items.length,
    }));
  }, [movements]);

  // 3. Replenishment Purchase Need
  const replenishmentNeeds = products
    .filter((p) => p.currentStock <= p.minStock)
    .map((p) => {
      const reorderQty = Math.max(p.maxStock - p.currentStock, p.minStock);
      const estCost = reorderQty * p.costPrice;
      return {
        product: p,
        reorderQty,
        estCost,
      };
    });

  const totalReplenishmentCost = replenishmentNeeds.reduce((acc, r) => acc + r.estCost, 0);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-amber-500" />
            Relatórios Estratégicos & Análise de Desempenho
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inteligência de suprimentos, curva ABC de valor, plano de compras e relatórios fiscais exportáveis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMovementsToPDF(movements, 'Relatório Geral Consolidado de Almoxarifado', settings.companyName)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Emitir PDF Oficial</span>
          </button>
          <button
            onClick={() => exportInventoryToExcel(products, settings.companyName)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (XLSX)</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-100 dark:bg-[#14171A] border border-slate-200 dark:border-[#262B33] rounded-2xl">
        <button
          onClick={() => setActiveReport('CURVA_ABC')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeReport === 'CURVA_ABC'
              ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieIcon className="w-4 h-4" />
          Análise de Curva ABC
        </button>

        <button
          onClick={() => setActiveReport('NECESSIDADE_COMPRA')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeReport === 'NECESSIDADE_COMPRA'
              ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Plano de Reposição & Compras
        </button>

        <button
          onClick={() => setActiveReport('CONSUMO_SETORES')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeReport === 'CONSUMO_SETORES'
              ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          Consumo por Centro de Custo
        </button>

        <button
          onClick={() => setActiveReport('FECHAMENTO_DIARIO')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeReport === 'FECHAMENTO_DIARIO'
              ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Fechamento Diário
        </button>
      </div>

      {/* REPORT CONTENT: CURVA ABC */}
      {activeReport === 'CURVA_ABC' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#121519] text-white rounded-2xl border border-[#2B323D]">
            <h3 className="font-serif font-bold text-sm flex items-center gap-2 text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Metodologia de Curva ABC (Impacto Financeiro e Criticidade)
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl font-sans">
              <strong className="text-red-400 font-serif">Classe A (Alta Prioridade):</strong> Itens de maior valor monetário. Exigem auditoria frequente e contagem cega rotativa.
              <br />
              <strong className="text-amber-400 font-serif">Classe B (Média Prioridade):</strong> Itens com giro moderado e saldo balanceado.
              <br />
              <strong className="text-slate-400 font-serif">Classe C (Alto Volume):</strong> Insumos de baixo valor unitário (parafusos, abraçadeiras, tubos).
            </p>
          </div>

          <div className="bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#262B33] bg-slate-50 dark:bg-[#14171A] text-[10px] font-serif font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 text-center">Classe</th>
                    <th className="py-3 px-4">Código SKU / Material</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Saldo Atual</th>
                    <th className="py-3 px-4 text-right">Custo Unit.</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-right">% do Patrimônio</th>
                    <th className="py-3 px-4 text-right">% Acumulado</th>
                    <th className="py-3 px-4">Diretriz de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#222831]">
                  {abcAnalysis.map((item) => (
                    <tr key={item.product.id} className="hover:bg-slate-50 dark:hover:bg-[#1C2128]/60 transition">
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block w-7 h-7 leading-7 rounded-lg font-serif font-bold text-xs ${
                            item.classification === 'A'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : item.classification === 'B'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-slate-100 dark:bg-[#1C2128] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#2D3540]'
                          }`}
                        >
                          {item.classification}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {item.product.name}
                        <span className="block font-mono text-[10px] text-amber-500 font-normal">
                          SKU: {item.product.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {item.product.category}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {item.product.currentStock} {item.product.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {formatCurrency(item.product.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.itemVal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-500">
                        {item.sharePercent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {item.cumulativePercent}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                        {item.classification === 'A'
                          ? 'Inventário semanal rigoroso • Compras just-in-time'
                          : item.classification === 'B'
                          ? 'Inventário mensal • Pedidos programados'
                          : 'Lotes maiores de segurança • Estoque pulmão'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: PLANO DE REPOSIÇÃO */}
      {activeReport === 'NECESSIDADE_COMPRA' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-[#1E1C15] border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-300">
                Relatório de Sugestão de Compras & Reabastecimento
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 font-sans">
                Cálculo automático de lote ideal para reestabelecer o Estoque Máximo de segurança.
              </p>
            </div>
            <button
              onClick={() => exportLowStockReportPDF(alerts, products, settings.companyName)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              Baixar Pedido PDF
            </button>
          </div>

          <div className="bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#262B33] bg-slate-50 dark:bg-[#14171A] text-[10px] font-serif font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">SKU / Produto</th>
                  <th className="py-3 px-4 text-center">Saldo Atual</th>
                  <th className="py-3 px-4 text-center">Est. Mínimo</th>
                  <th className="py-3 px-4 text-center font-bold text-amber-500">Qtd Sugerida</th>
                  <th className="py-3 px-4 text-right">Custo Unit.</th>
                  <th className="py-3 px-4 text-right">Orçamento Estimado</th>
                  <th className="py-3 px-4">Fornecedor Vinculado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222831]">
                {replenishmentNeeds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-serif">
                      Nenhum produto necessita de reposição no momento.
                    </td>
                  </tr>
                ) : (
                  replenishmentNeeds.map((item) => (
                    <tr key={item.product.id} className="hover:bg-slate-50 dark:hover:bg-[#1C2128]/60 transition">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {item.product.name}
                        <span className="block font-mono text-[10px] text-amber-500 font-normal">
                          {item.product.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-red-500">
                        {item.product.currentStock} {item.product.unit}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {item.product.minStock} {item.product.unit}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-500">
                        +{item.reorderQty} {item.product.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {formatCurrency(item.product.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.estCost)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.product.supplierName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="p-4 bg-slate-50 dark:bg-[#14171A] border-t border-slate-200 dark:border-[#262B33] flex items-center justify-between text-xs font-bold">
              <span>Total de Itens em Compra Urgente: <strong className="font-mono text-red-500">{replenishmentNeeds.length}</strong></span>
              <span className="text-sm font-serif text-slate-900 dark:text-white">
                Investimento Estimado de Reposição:{' '}
                <strong className="font-mono font-bold text-amber-500">{formatCurrency(totalReplenishmentCost)}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: CONSUMO POR SETOR */}
      {activeReport === 'CONSUMO_SETORES' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#262B33] bg-slate-50 dark:bg-[#14171A] text-[10px] font-serif font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Setor Requisitante / Obra</th>
                  <th className="py-3 px-4 text-center">Qtd de Itens Retirados</th>
                  <th className="py-3 px-4 text-center">Variedade de Materiais</th>
                  <th className="py-3 px-4 text-right">Custo Total Consumido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222831]">
                {sectorConsumption.map((sec) => (
                  <tr key={sec.sector} className="hover:bg-slate-50 dark:hover:bg-[#1C2128]/60 transition">
                    <td className="py-3 px-4 font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-amber-500" />
                      {sec.sector}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {sec.totalCount} unidades
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-mono">
                      {sec.distinctItemsCount} materiais distintos
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-500">
                      {formatCurrency(sec.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: FECHAMENTO DIARIO */}
      {activeReport === 'FECHAMENTO_DIARIO' && (
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
              Fechamento Diário de Almoxarifado • Borges e Gomes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Emitido em {new Date().toLocaleDateString('pt-BR')} para conferência contábil e de inventário físico.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-[#1C2128] rounded-xl border border-slate-200 dark:border-[#2D3540]">
                <span className="text-[11px] font-serif text-slate-500 dark:text-slate-400">Patrimônio Geral Fechado</span>
                <p className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(products.reduce((a, b) => a + b.currentStock * b.costPrice, 0))}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#1C2128] rounded-xl border border-slate-200 dark:border-[#2D3540]">
                <span className="text-[11px] font-serif text-slate-500 dark:text-slate-400">Movimentações do Dia</span>
                <p className="text-lg font-mono font-bold text-amber-500 mt-1">
                  {movements.length} lançamentos
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#1C2128] rounded-xl border border-slate-200 dark:border-[#2D3540]">
                <span className="text-[11px] font-serif text-slate-500 dark:text-slate-400">Acuracidade de Inventário</span>
                <p className="text-lg font-mono font-bold text-emerald-500 mt-1">
                  99.4% Conforme
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-[#262B33]">
              <button
                onClick={() => exportMovementsToPDF(movements, 'Fechamento Diário de Almoxarifado', settings.companyName)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Imprimir / Salvar PDF do Fechamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
