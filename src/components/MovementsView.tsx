import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Search,
  FileSpreadsheet,
  FileText,
  User,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  Undo2,
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
  const { movements, settings, deleteMovement, deleteMovementsBulk, clearAllMovements } = useInventory();

  const [dateFilter, setDateFilter] = useState<'HOJE' | '7_DIAS' | '30_DIAS' | 'TODOS'>('HOJE');
  const [typeFilter, setTypeFilter] = useState<MovementType | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [movementToDelete, setMovementToDelete] = useState<StockMovement | null>(null);
  const [revertStockOnDelete, setRevertStockOnDelete] = useState(true);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

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

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMovements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMovements.map((m) => m.id));
    }
  };

  const confirmDeleteSingle = () => {
    if (!movementToDelete) return;
    deleteMovement(movementToDelete.id, revertStockOnDelete);
    setSelectedIds((prev) => prev.filter((id) => id !== movementToDelete.id));
    setMovementToDelete(null);
  };

  const confirmDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Tem certeza que deseja apagar ${selectedIds.length} movimentação(ões) selecionada(s)?`)) {
      deleteMovementsBulk(selectedIds, revertStockOnDelete);
      setSelectedIds([]);
    }
  };

  const confirmClearAll = () => {
    clearAllMovements();
    setSelectedIds([]);
    setShowClearAllModal(false);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
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
          {selectedIds.length > 0 && (
            <button
              id="btn-delete-bulk-movements"
              onClick={confirmDeleteBulk}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Apagar Selecionados ({selectedIds.length})</span>
            </button>
          )}

          <button
            id="btn-export-movements-excel"
            onClick={() => exportMovementsToExcel(filteredMovements, 'Historico_Movimentacoes')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2128] dark:hover:bg-[#252C36] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2C333E] flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Excel (.XLSX)</span>
          </button>

          <button
            id="btn-export-movements-pdf"
            onClick={handleExportPDF}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2128] dark:hover:bg-[#252C36] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2C333E] flex items-center gap-1.5 transition"
          >
            <FileText className="w-4 h-4 text-amber-500" />
            <span>PDF Executivo</span>
          </button>

          <button
            id="btn-new-entry-movement"
            onClick={() => onOpenMovementModal('ENTRADA')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>+ Entrada</span>
          </button>

          <button
            id="btn-new-exit-movement"
            onClick={() => onOpenMovementModal('SAIDA')}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- Saída</span>
          </button>

          {movements.length > 0 && (
            <button
              id="btn-clear-all-movements"
              onClick={() => setShowClearAllModal(true)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition"
              title="Limpar todas as movimentações"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-serif font-bold uppercase tracking-wider">Entradas</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalEntries.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">registros</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            Total: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(sumEntriesValue)}</strong>
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-serif font-bold uppercase tracking-wider">Saídas p/ Obra</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-red-600 dark:text-red-400">
              {totalExits.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">requisições</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            Total: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(sumExitsValue)}</strong>
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-serif font-bold uppercase tracking-wider">Ajustes Balanço</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {filteredMovements.filter((m) => m.type === 'AJUSTE').length}
            </span>
            <span className="text-xs text-slate-500 font-mono">balanços</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Contagem física periódica
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-serif font-bold uppercase tracking-wider">Total Período</span>
            <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
              {dateFilter}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-[#F9FAFB]">
              {filteredMovements.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">movimentações</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            Impacto: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(sumEntriesValue + sumExitsValue)}</strong>
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#121519] rounded-xl text-xs font-semibold">
            {(['HOJE', '7_DIAS', '30_DIAS', 'TODOS'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  dateFilter === period
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {period === 'HOJE' ? 'Hoje' : period === '7_DIAS' ? 'Últimos 7 Dias' : period === '30_DIAS' ? 'Últimos 30 Dias' : 'Todo o Histórico'}
              </button>
            ))}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#121519] rounded-xl text-xs font-semibold">
            {(['TODOS', 'ENTRADA', 'SAIDA', 'AJUSTE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  typeFilter === type
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type === 'TODOS' ? 'Todos' : type === 'ENTRADA' ? 'Entradas' : type === 'SAIDA' ? 'Saídas' : 'Ajustes'}
              </button>
            ))}
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
                <th className="py-3.5 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-amber-500 transition"
                    title="Selecionar todos"
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredMovements.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4 text-center">Tipo</th>
                <th className="py-3.5 px-4">Material / SKU</th>
                <th className="py-3.5 px-4 text-center">Qtd</th>
                <th className="py-3.5 px-4 text-center">Saldo (Ant. → Novo)</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4">Documento / Setor</th>
                <th className="py-3.5 px-4">Operador</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21262E] text-xs">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Nenhuma movimentação registrada no período selecionado.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#1C2128]/70 transition ${
                        isSelected ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(m.id)}
                          className="text-slate-400 hover:text-amber-500 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

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
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
                          <span>{m.operatorName}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setMovementToDelete(m)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                          title="Apagar este registro de movimentação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Single Delete */}
      {movementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#2C333E] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                Apagar Registro de Movimentação
              </h3>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#121519] rounded-xl border border-slate-200 dark:border-[#262B33] text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">{movementToDelete.productName}</p>
              <p className="text-slate-500">
                Tipo: <strong className="text-amber-500">{movementToDelete.type}</strong> ({movementToDelete.quantity} un)
              </p>
              <p className="text-slate-500">Data: {formatDate(movementToDelete.timestamp)}</p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
              <input
                id="checkbox-revert-stock"
                type="checkbox"
                checked={revertStockOnDelete}
                onChange={(e) => setRevertStockOnDelete(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="checkbox-revert-stock" className="cursor-pointer">
                <strong>Reverter o saldo do produto em estoque?</strong>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {movementToDelete.type === 'ENTRADA'
                    ? 'Subtrairá a quantidade do estoque atual.'
                    : movementToDelete.type === 'SAIDA'
                    ? 'Devolverá a quantidade ao estoque atual.'
                    : 'Restaurará o estoque anterior ao ajuste.'}
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMovementToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-[#1C2128] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-[#252C36] transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingle}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Apagar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#16191D] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                Limpar Todo o Histórico de Movimentações?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Esta ação apagará permanentemente todas as <strong>{movements.length}</strong> movimentações registradas no sistema.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-[#1C2128] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-[#252C36] transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Todo o Histórico</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
