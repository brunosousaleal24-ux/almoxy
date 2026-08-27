import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  DollarSign,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  ShieldCheck,
  Barcode,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  Clock,
  Layers,
  Wrench,
  Users,
  Award,
  Search,
  CheckCircle2,
  RefreshCw,
  Wifi,
  ExternalLink,
  Filter,
  Sparkles,
  Flame,
  UserCheck,
  Building,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatDate, exportInventoryToExcel, exportMovementsToPDF } from '../utils/exportUtils';
import { Product, ProductCategory } from '../types';

interface DashboardViewProps {
  onOpenScanner: () => void;
  onOpenMovementModal: (type?: 'ENTRADA' | 'SAIDA') => void;
  onSelectProduct: (product: Product) => void;
  onNavigateTab: (tab: any) => void;
}

const CATEGORY_COLORS = [
  '#D4AF37', // Champagne Gold
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Crimson
  '#8B5CF6', // Royal Purple
  '#06B6D4', // Cyan Ink
  '#C5A880', // Warm Bronze
  '#64748B', // Slate Charcoal
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenScanner,
  onOpenMovementModal,
  onSelectProduct,
  onNavigateTab,
}) => {
  const {
    products,
    movements,
    stats,
    alerts,
    toolsRanking,
    employeeRanking,
    firebaseStatus,
    syncWithFirebase,
    isSyncing,
  } = useInventory();

  // Search & Filter state for Rankings
  const [toolSearch, setToolSearch] = useState('');
  const [toolCategoryFilter, setToolCategoryFilter] = useState<string>('TODAS');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Quick SKU / Barcode Terminal search
  const [terminalQuery, setTerminalQuery] = useState('');

  // 1. Prepare Daily Trend Data (Last 7 Days)
  const last7DaysData = useMemo(() => {
    const days: { [key: string]: { date: string; entradas: number; saidas: number; valorEntradas: number; valorSaidas: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      days[dateStr] = { date: label, entradas: 0, saidas: 0, valorEntradas: 0, valorSaidas: 0 };
    }

    movements.forEach((m) => {
      const dayKey = m.timestamp.slice(0, 10);
      if (days[dayKey]) {
        if (m.type === 'ENTRADA') {
          days[dayKey].entradas += m.quantity;
          days[dayKey].valorEntradas += m.totalCost;
        } else if (m.type === 'SAIDA') {
          days[dayKey].saidas += m.quantity;
          days[dayKey].valorSaidas += m.totalCost;
        }
      }
    });

    return Object.values(days);
  }, [movements]);

  // 2. Sector / Department consumption distribution
  const sectorDistribution = useMemo(() => {
    const sectorMap: { [sec: string]: { sector: string; count: number; value: number } } = {};
    movements
      .filter((m) => m.type === 'SAIDA')
      .forEach((m) => {
        const sec = m.requesterSector || 'Geral';
        if (!sectorMap[sec]) {
          sectorMap[sec] = { sector: sec, count: 0, value: 0 };
        }
        sectorMap[sec].count += m.quantity;
        sectorMap[sec].value += m.totalCost;
      });

    return Object.values(sectorMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [movements]);

  // 3. Category Valuation Distribution
  const categoryDistribution = useMemo(() => {
    const map: { [cat: string]: number } = {};
    products.forEach((p) => {
      const val = p.currentStock * p.costPrice;
      map[p.category] = (map[p.category] || 0) + val;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [products]);

  // Filtered Tools Ranking
  const filteredTools = useMemo(() => {
    return toolsRanking.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
        t.sku.toLowerCase().includes(toolSearch.toLowerCase());
      const matchCat = toolCategoryFilter === 'TODAS' || t.category === toolCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [toolsRanking, toolSearch, toolCategoryFilter]);

  // Filtered Employee Ranking
  const filteredEmployees = useMemo(() => {
    return employeeRanking.filter((e) => {
      return (
        e.employeeName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        e.sector.toLowerCase().includes(employeeSearch.toLowerCase())
      );
    });
  }, [employeeRanking, employeeSearch]);

  // Terminal matched product
  const terminalMatchedProduct = useMemo(() => {
    if (!terminalQuery.trim()) return null;
    const q = terminalQuery.trim().toLowerCase();
    return products.find(
      (p) =>
        p.barcode.toLowerCase() === q ||
        p.sku.toLowerCase() === q ||
        p.name.toLowerCase().includes(q)
    );
  }, [products, terminalQuery]);

  // Top highlight tool and employee
  const topTool = toolsRanking[0];
  const topEmployee = employeeRanking[0];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Master Command Center Banner with Firebase Real-time Status */}
      <div className="bg-gradient-to-r from-[#121519] via-[#181C23] to-[#121519] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-amber-500/25 dark:border-[#2C333D]">
        <div className="absolute -right-8 -top-8 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Painel Executivo 360°
              </span>

              {/* Firebase Live Cloud Status Pill */}
              <button
                onClick={() => syncWithFirebase()}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80 transition"
                title={`Projeto Firebase: ${firebaseStatus.projectId} - Clique para forçar sincronização`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Firebase: {firebaseStatus.projectId}</span>
                {isSyncing ? (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-300" />
                ) : (
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                )}
              </button>

              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Sincronizado: {formatDate(firebaseStatus.lastSyncTime)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#F9FAFB]">
              Borges & Gomes Engenharia — Almoxarifado Central
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl font-sans leading-relaxed">
              Sistema Integrado de Gestão de Cautelas de Ferramentas, Entradas/Saídas de Materiais de Construção, Acuracidade Física e Controle Orçamentário de Obras.
            </p>
          </div>

          {/* Quick Action Buttons Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-dash-open-scanner"
              onClick={onOpenScanner}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold font-sans flex items-center gap-2 border border-amber-500/40 shadow-lg transition active:scale-95"
            >
              <Barcode className="w-4 h-4 text-amber-400" />
              Bipar Câmera
            </button>
            <button
              id="btn-dash-quick-entry"
              onClick={() => onOpenMovementModal('ENTRADA')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition active:scale-95"
            >
              <ArrowDownRight className="w-4 h-4" />
              + Entrada (NF)
            </button>
            <button
              id="btn-dash-quick-exit"
              onClick={() => onOpenMovementModal('SAIDA')}
              className="px-3.5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shadow-lg shadow-red-900/30 transition active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              - Cautela / Saída
            </button>
            <button
              onClick={() => exportInventoryToExcel(products)}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title="Exportar Balanço Geral em Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Executive Metrics (5 Key Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Patrimônio Total */}
        <div className="p-4 bg-[#0D131F] border border-amber-500/25 rounded-2xl shadow-lg hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Patrimônio Estocado
            </span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/30">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg sm:text-xl font-serif font-bold text-amber-300 tracking-tight">
              {formatCurrency(stats.totalValuation)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <Layers className="w-3 h-3 text-amber-500" />
              <span className="font-mono">{stats.totalSkus} SKUs catalogados</span>
            </div>
          </div>
        </div>

        {/* Card 2: Itens no Galpão */}
        <div className="p-4 bg-[#0D131F] border border-emerald-500/25 rounded-2xl shadow-lg hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Saldo Físico Geral
            </span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg sm:text-xl font-serif font-bold text-slate-100 tracking-tight">
              {stats.totalItems.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400 font-sans">unidades</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span className="font-mono">+{stats.entriesToday} entradas hoje</span>
            </div>
          </div>
        </div>

        {/* Card 3: Ferramenta Mais Usada */}
        <div className="p-4 bg-[#0D131F] border border-amber-500/25 rounded-2xl shadow-lg hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" />
              Ferramenta Nº 1
            </span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/30">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xs sm:text-sm font-serif font-bold text-slate-100 truncate tracking-tight" title={topTool?.name || 'Nenhuma'}>
              {topTool ? topTool.name : 'Nenhuma saída'}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <Award className="w-3 h-3 text-amber-500" />
              <span className="font-mono">{topTool ? `${topTool.timesRequested} requisições (${topTool.totalQuantityUsed} un)` : '-'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Colaborador Mais Ativo */}
        <div className="p-4 bg-[#0D131F] border border-amber-500/25 rounded-2xl shadow-lg hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-amber-400" />
              Colaborador Líder
            </span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/30">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xs sm:text-sm font-serif font-bold text-slate-100 truncate tracking-tight" title={topEmployee?.employeeName || 'Nenhum'}>
              {topEmployee ? topEmployee.employeeName : 'Nenhum'}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <Award className="w-3 h-3 text-amber-400" />
              <span className="font-mono">{topEmployee ? `${topEmployee.totalMovements} retiradas (${topEmployee.totalItemsTaken} itens)` : '-'}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Estoque Crítico */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 p-4 bg-[#0D131F] border border-red-500/30 rounded-2xl shadow-lg hover:border-red-500/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Estoque Crítico
            </span>
            <div className={`p-1.5 rounded-lg border ${alerts.length > 0 ? 'bg-red-950/60 text-red-400 border-red-500/40' : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'}`}>
              {alerts.length > 0 ? <AlertOctagon className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg sm:text-xl font-serif font-bold text-red-400 tracking-tight">
              {stats.criticalStockCount + stats.lowStockCount}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">alertas</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-red-400 font-medium font-mono">
              {stats.criticalStockCount > 0 ? (
                <span>{stats.criticalStockCount} em ruptura imediata</span>
              ) : (
                <span className="text-emerald-400">Nenhum item zerado</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Barcode & SKU Fast Action Terminal */}
      <div className="p-4 bg-[#0D131F] border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/70" />
          <input
            type="text"
            value={terminalQuery}
            onChange={(e) => setTerminalQuery(e.target.value)}
            placeholder="Terminal Rápido: Digite ou bipe SKU, Código de Barras (ex: 7891117011025) ou Nome do Material..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-amber-500/30 rounded-xl text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 shadow-inner"
          />
        </div>

        {terminalMatchedProduct && (
          <div className="flex items-center gap-2.5 p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl">
            <div className="text-xs">
              <span className="font-bold text-amber-300 font-serif">{terminalMatchedProduct.name}</span>
              <span className="ml-2 font-mono text-[11px] text-slate-300">
                Saldo: <strong className="text-emerald-400">{terminalMatchedProduct.currentStock} {terminalMatchedProduct.unit}</strong> • Custo: {formatCurrency(terminalMatchedProduct.costPrice)}
              </span>
            </div>
            <button
              onClick={() => {
                onSelectProduct(terminalMatchedProduct);
                onOpenMovementModal('SAIDA');
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm cursor-pointer"
            >
              Dar Cautela
            </button>
          </div>
        )}
      </div>

      {/* 4. CORE RANKINGS SECTION (DUAL SIDE-BY-SIDE PANELS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RANKING A: FERRAMENTAS MAIS USADAS */}
        <div className="p-5 bg-[#0D131F] border border-amber-500/25 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                    Ranking: Ferramentas Mais Usadas
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50">
                      {filteredTools.length} itens
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Frequência de saída, volume de empréstimos e colaborador que mais utilizou
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={toolCategoryFilter}
                  onChange={(e) => setToolCategoryFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-[#111827] border border-amber-500/30 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="TODAS">Todas Categorias</option>
                  <option value="Ferramentas">Somente Ferramentas</option>
                  <option value="EPI">EPIs</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Hidráulica">Hidráulica</option>
                </select>
              </div>
            </div>

            {/* Tool Search Input */}
            <div className="mb-3 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                placeholder="Buscar ferramenta no ranking..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#111827] border border-amber-500/30 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Ranking List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredTools.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Nenhuma ferramenta encontrada para os filtros selecionados.
                </div>
              ) : (
                filteredTools.map((tool, idx) => {
                  const prod = products.find((p) => p.id === tool.productId);
                  const isGold = idx === 0;
                  const isSilver = idx === 1;
                  const isBronze = idx === 2;

                  return (
                    <div
                      key={tool.productId}
                      className={`p-3 rounded-xl border transition ${
                        isGold
                          ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/40 dark:border-amber-500/30'
                          : 'bg-slate-50/80 dark:bg-[#1C2128] border-slate-200 dark:border-[#2B323D]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {/* Rank Badge */}
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-sm ${
                              isGold
                                ? 'bg-amber-500 text-slate-950 border border-amber-300'
                                : isSilver
                                ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                                : isBronze
                                ? 'bg-amber-800 text-amber-100'
                                : 'bg-slate-200 dark:bg-[#282F3A] text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${idx + 1}`}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-serif font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {tool.name}
                              </span>
                              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-slate-200 dark:bg-[#252C36] text-slate-700 dark:text-slate-300">
                                {tool.sku}
                              </span>
                            </div>

                            {/* Detailed metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                              <div>
                                Requisições:{' '}
                                <strong className="text-amber-700 dark:text-amber-400 font-mono">
                                  {tool.timesRequested}x
                                </strong>{' '}
                                ({tool.totalQuantityUsed} {tool.unit})
                              </div>
                              <div>
                                Emprestado para:{' '}
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {tool.topEmployee}
                                </strong>
                              </div>
                              <div>
                                Saldo Atual:{' '}
                                <strong
                                  className={`font-mono ${
                                    tool.currentStock === 0
                                      ? 'text-red-500'
                                      : tool.currentStock <= 2
                                      ? 'text-amber-500'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {tool.currentStock} {tool.unit}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Action Button */}
                        <button
                          onClick={() => {
                            if (prod) onSelectProduct(prod);
                            onOpenMovementModal('SAIDA');
                          }}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm transition active:scale-95 shrink-0"
                          title="Dar saída / cautela desta ferramenta"
                        >
                          Cautela
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#232830] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Rastreabilidade de Ferramentas Ativa</span>
            <button
              onClick={() => onNavigateTab('movements')}
              className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
            >
              Ver Todas Cautelas →
            </button>
          </div>
        </div>

        {/* RANKING B: FUNCIONÁRIOS QUE MAIS USARAM / REQUISITARAM */}
        <div className="p-5 bg-[#0D131F] border border-amber-500/25 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                    Ranking: Funcionários Requisitantes
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50">
                      {filteredEmployees.length} colaboradores
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Colaboradores com maior volume de itens e ferramentas sob cautela
                  </p>
                </div>
              </div>
            </div>

            {/* Employee Search Input */}
            <div className="mb-3 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Buscar colaborador ou setor..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#111827] border border-amber-500/30 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Ranking List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredEmployees.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Nenhum colaborador registrado em saídas ainda.
                </div>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const isGold = idx === 0;
                  const isSilver = idx === 1;
                  const isBronze = idx === 2;

                  // Initials for avatar
                  const initials = emp.employeeName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={emp.employeeName}
                      className={`p-3 rounded-xl border transition ${
                        isGold
                          ? 'bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-400/40 dark:border-indigo-500/30'
                          : 'bg-slate-50/80 dark:bg-[#1C2128] border-slate-200 dark:border-[#2B323D]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {/* Avatar & Rank badge */}
                          <div className="relative shrink-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-mono shadow-sm ${
                                isGold
                                  ? 'bg-indigo-600 text-white'
                                  : isSilver
                                  ? 'bg-slate-600 text-white'
                                  : isBronze
                                  ? 'bg-amber-800 text-amber-100'
                                  : 'bg-slate-200 dark:bg-[#282F3A] text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {initials}
                            </div>
                            <span className="absolute -bottom-1 -right-1 text-[10px]">
                              {isGold ? '🏆' : isSilver ? '🥈' : isBronze ? '🥉' : `#${idx + 1}`}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-serif font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {emp.employeeName}
                              </span>
                              <span className="px-1.5 py-0.2 text-[9px] font-sans rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                                {emp.sector}
                              </span>
                            </div>

                            {/* Detailed employee metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                              <div>
                                Retiradas:{' '}
                                <strong className="text-indigo-700 dark:text-indigo-400 font-mono">
                                  {emp.totalMovements}x
                                </strong>{' '}
                                ({emp.totalItemsTaken} itens)
                              </div>
                              <div>
                                Ferramenta Principal:{' '}
                                <strong className="text-slate-800 dark:text-slate-200 truncate inline-block max-w-[110px] align-bottom" title={emp.mostUsedItem}>
                                  {emp.mostUsedItem}
                                </strong>
                              </div>
                              <div>
                                Valor Acumulado:{' '}
                                <strong className="text-slate-900 dark:text-slate-200 font-mono">
                                  {formatCurrency(emp.totalValueTaken)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Cautela button */}
                        <button
                          onClick={() => onOpenMovementModal('SAIDA')}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm transition active:scale-95 shrink-0"
                          title="Emitir nova cautela para este colaborador"
                        >
                          Nova Cautela
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#232830] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Controle Individual de Responsabilidade</span>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Relatório por Funcionário →
            </button>
          </div>
        </div>
      </div>

      {/* 5. VISUAL ANALYTICS SECTION (CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Flow Chart: Daily Entries vs Exits Trend */}
        <div className="lg:col-span-2 p-5 bg-[#0D131F] border border-amber-500/25 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-white">
                Fluxo de Movimentação Diária
              </h3>
              <p className="text-xs text-slate-400">
                Volume físico de Entradas (compras) vs Saídas (cautelas e obras)
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('movements')}
              className="text-xs font-serif font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Histórico Completo →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D131F',
                    borderColor: '#F59E0B33',
                    borderRadius: '10px',
                    color: '#F3F4F6',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="entradas"
                  name="Entradas (Qtd)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEntradas)"
                />
                <Area
                  type="monotone"
                  dataKey="saidas"
                  name="Saídas / Cautelas (Qtd)"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSaidas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector / Department Consumption Chart */}
        <div className="p-5 bg-[#0D131F] border border-amber-500/25 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  Consumo por Setor / Obra
                </h3>
                <p className="text-xs text-slate-400">
                  Centros de custo com maior demanda
                </p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorDistribution} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis type="category" dataKey="sector" stroke="#94a3b8" fontSize={10} width={90} tickFormatter={(v) => v.slice(0, 12)} />
                  <Tooltip
                    formatter={(val: any) => [`${val} unidades`, 'Total Retirado']}
                    contentStyle={{
                      backgroundColor: '#0D131F',
                      borderColor: '#F59E0B33',
                      borderRadius: '10px',
                      color: '#F3F4F6',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-500/20 text-xs text-slate-400 flex items-center justify-between">
            <span>Centros de custo alinhados</span>
            <span className="font-semibold text-amber-400 font-mono">100% Auditável</span>
          </div>
        </div>
      </div>

      {/* 6. LIVE MOVEMENTS & AUDIT FEED */}
      <div className="p-5 bg-[#0D131F] border border-amber-500/25 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Últimas Movimentações & Cautelas em Tempo Real
            </h3>
            <p className="text-xs text-slate-400">
              Registro contínuo de entradas de notas fiscais e saídas para colaboradores
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('movements')}
            className="text-xs font-serif font-bold text-amber-400 hover:underline cursor-pointer"
          >
            Ver Todas ({movements.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111827] text-amber-300 font-serif border-b border-amber-500/20">
              <tr>
                <th className="p-2.5 rounded-l-lg">Horário</th>
                <th className="p-2.5">Tipo</th>
                <th className="p-2.5">Produto / Ferramenta</th>
                <th className="p-2.5 text-right">Qtd</th>
                <th className="p-2.5">Colaborador (Cautela)</th>
                <th className="p-2.5">Setor / Obra</th>
                <th className="p-2.5">Almoxarife</th>
                <th className="p-2.5 rounded-r-lg">Doc / OS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/10">
              {movements.slice(0, 7).map((m) => (
                <tr key={m.id} className="hover:bg-[#151D2C] transition">
                  <td className="p-2.5 font-mono text-[11px] text-slate-400">
                    {formatDate(m.timestamp)}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.type === 'ENTRADA'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : m.type === 'SAIDA'
                          ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td className="p-2.5 font-semibold text-slate-100 max-w-[200px] truncate">
                    {m.productName}
                  </td>
                  <td className="p-2.5 font-mono text-right font-bold text-amber-300">
                    {m.quantity}
                  </td>
                  <td className="p-2.5 text-slate-200">
                    {m.employeeName ? (
                      <span className="font-semibold text-amber-300">{m.employeeName}</span>
                    ) : (
                      <span className="text-slate-500 italic">-</span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-300 text-[11px]">
                    {m.requesterSector || 'Almoxarifado'}
                  </td>
                  <td className="p-2.5 text-slate-300 text-[11px]">
                    {m.operatorName}
                  </td>
                  <td className="p-2.5 font-mono text-[11px] text-slate-400">
                    {m.documentNumber || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
