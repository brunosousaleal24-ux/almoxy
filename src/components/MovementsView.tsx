import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Calendar,
  Building,
  User,
  CheckCircle,
  PlusCircle,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { MovementType, StockMovement } from '../types';
import {
  formatCurrency,
  formatDate,
  exportMovementsToExcel,
  exportMovementsToPDF,
} from '../utils/exportUtils';

interface MovementsViewProps {
  onOpenMovementModal: (type?: MovementType) => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({ onOpenMovementModal }) => {
  const { movements, settings } = useInventory();

  const [dateFilter, setDateFilter] = useState<'HOJE' | '7_DIAS' | '30_DIAS' | 'TODOS'>('HOJE');
  const [typeFilter, setTypeFilter] = useState<MovementType | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Date filtering logic
  const filteredMovements = movements.filter((m) => {
    const movDate = new Date(m.timestamp);
    const now = new Date();

    if (dateFilter === 'HOJE') {
      const todayStr = now.toISOString().slice(0, 10);
      if (!m.timestamp.startsWith(todayStr)) return false;
    } else if (dateFilter === '7_DIAS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      if (movDate < sevenDaysAgo) return false;
    } else if (dateFilter === '30_DIAS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      if (movDate < thirtyDaysAgo) return false;
    }

    if (typeFilter !== 'TODOS' && m.type !== typeFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchProduct = m.productName.toLowerCase().includes(term);
      const matchSku = m.productSku.toLowerCase().includes(term);
      const matchDoc = m.documentNumber?.toLowerCase().includes(term) || false;
      const matchSector = m.requesterSector?.toLowerCase().includes(term) || false;
      const matchOp = m.operatorName.toLowerCase().includes(term);
      if (!matchProduct && !matchSku && !matchDoc && !matchSector && !matchOp) return false;
    }

    return true;
  });

  // Calculate daily / filtered totals
  const totalEntries = filteredMovements.filter((m) => m.type === 'ENTRADA');
  const totalExits = filteredMovements.filter((m) => m.type === 'SAIDA');
  const sumEntriesValue = totalEntries.reduce((acc, m) => acc + m.totalCost, 0);
  const sumExitsValue = totalExits.reduce((acc, m) => acc + m.totalCost, 0);

  const handleExportPDF = () => {
    const periodLabel =
      dateFilter === 'HOJE'
        ? 'Relatório Diário de Movimentação do Almoxarifado'
        : dateFilter === '7_DIAS'
        ? 'Relatório Semanal de Movimentações (Últimos 7 Dias)'
        : dateFilter === '30_DIAS'
        ? 'Relatório Mensal de Movimentações (Últimos 30 Dias)'
        : 'Relatório Histórico Completo de Movimentações';

    exportMovementsToPDF(filteredMovements, periodLabel, settings.companyName);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-[#F9FAFB] tracking-tight">
            Registro & Histórico de Movimentações
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Acompanhamento de entradas (compras/devoluções), saídas (obras/setores) e ajustes de inventário.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to PDF */}
          <button
            id="btn-export-movements-pdf"
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-slate-900 dark:bg-[#1A1F26] hover:bg-slate-800 dark:hover:bg-[#232A34] text-slate-200 hover:text-white border border-slate-700/60 dark:border-[#2F3744] text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            title="Gerar e baixar Relatório em PDF formatado"
          >
            <FileText className="w-4 h-4 text-red-400" />
            <span>Relatório PDF</span>
          </button>

          {/* Export to Excel */}
          <button
            id="btn-export-movements-excel"
            onClick={() => exportMovementsToExcel(filteredMovements, 'Movimentacoes_Almoxarifado')}
            className="px-3.5 py-2 bg-slate-900 dark:bg-[#1A1F26] hover:bg-slate-800 dark:hover:bg-[#232A34] text-slate-200 hover:text-white border border-slate-700/60 dark:border-[#2F3744] text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* New Movement Button */}
          <button
            id="btn-new-movement-view"
            onClick={() => onOpenMovementModal('ENTRADA')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold font-sans rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-900/20 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lançar Movimento</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Bar for Current Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#14171A] text-white rounded-2xl shadow-lg border border-amber-500/20 dark:border-[#282E37]">
        <div className="p-3 bg-[#1C2128] rounded-xl border border-slate-700/60 dark:border-[#2A313C] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block font-serif">
              Entradas no Período
            </span>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {formatCurrency(sumEntriesValue)}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {totalEntries.reduce((acc, m) => acc + m.quantity, 0)} un ({totalEntries.length} registros)
            </span>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3 bg-[#1C2128] rounded-xl border border-slate-700/60 dark:border-[#2A313C] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block font-serif">
              Saídas / Requisições
            </span>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {formatCurrency(sumExitsValue)}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {totalExits.reduce((acc, m) => acc + m.quantity, 0)} un ({totalExits.length} requisições)
            </span>
          </div>
          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/30">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3 bg-[#1C2128] rounded-xl border border-slate-700/60 dark:border-[#2A313C] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block font-serif">
              Saldo Líquido Movimentado
            </span>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {formatCurrency(sumEntriesValue - sumExitsValue)}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {filteredMovements.length} total de transações
            </span>
          </div>
          <div className="p-2 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/30">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Date Toggle Bar */}
      <div className="p-4 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Range Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#1C2128] rounded-xl border border-slate-200/50 dark:border-[#2A303A]">
            <button
              onClick={() => setDateFilter('HOJE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                dateFilter === 'HOJE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setDateFilter('7_DIAS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                dateFilter === '7_DIAS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => setDateFilter('30_DIAS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                dateFilter === '30_DIAS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Este Mês (30d)
            </button>
            <button
              onClick={() => setDateFilter('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                dateFilter === 'TODOS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Histórico Todo
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60 font-sans"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="ENTRADA">🟢 Somente Entradas (Compras/Devoluções)</option>
              <option value="SAIDA">🔴 Somente Saídas (Requisições)</option>
              <option value="AJUSTE">🟠 Somente Ajustes (Inventário)</option>
              <option value="TRANSFERENCIA">🔵 Somente Transferências</option>
            </select>
          </div>
        </div>

        {/* Text search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome do produto, SKU, nº da NF/OS, setor requisitante ou operador..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60 font-sans"
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#262B33] bg-slate-50 dark:bg-[#13161A] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4 text-center">Tipo</th>
                <th className="py-3.5 px-4">Material / SKU</th>
                <th className="py-3.5 px-4 text-center">Qtd</th>
                <th className="py-3.5 px-4 text-center">Saldo (Ant. → Novo)</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4">Documento / Setor</th>
                <th className="py-3.5 px-4">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21262E] text-xs">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma movimentação registrada no período selecionado.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1C2128]/70 transition">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(m.timestamp)}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          m.type === 'ENTRADA'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900/60'
                            : m.type === 'SAIDA'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-900/60'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-900/60'
                        }`}
                      >
                        {m.type === 'ENTRADA' && <ArrowDownRight className="w-3 h-3" />}
                        {m.type === 'SAIDA' && <ArrowUpRight className="w-3 h-3" />}
                        {m.type}
                      </span>
                    </td>

                    {/* Product Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-slate-900 dark:text-[#F3F4F6] text-sm">
                        {m.productName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        SKU: <span className="text-amber-600 dark:text-amber-400">{m.productSku}</span> • Motivo: {m.reason}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-[#F3F4F6]">
                      {m.type === 'ENTRADA' ? '+' : m.type === 'SAIDA' ? '-' : ''}
                      {m.quantity}
                    </td>

                    {/* Stock Transition */}
                    <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{m.previousStock}</span> → <strong className="text-slate-900 dark:text-white">{m.newStock}</strong>
                    </td>

                    {/* Total Cost */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-[#F3F4F6]">
                      {formatCurrency(m.totalCost)}
                    </td>

                    {/* Document & Sector */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {m.documentNumber || 'S/ Documento'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {m.requesterSector || 'Almoxarifado'}
                      </div>
                    </td>

                    {/* Operator */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-500/70" />
                      <span>{m.operatorName}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
