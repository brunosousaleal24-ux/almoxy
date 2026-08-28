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
  SlidersHorizontal,
  Zap,
  Boxes,
  HardHat,
  ChevronRight,
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

  // Search, Category, and Sorting state for Tools Ranking Dashboard
  const [toolSearch, setToolSearch] = useState('');
  const [toolCategoryFilter, setToolCategoryFilter] = useState<string>('TODAS');
  const [toolSortBy, setToolSortBy] = useState<'REQUESTS' | 'QUANTITY' | 'VALUE' | 'STOCK_LOW' | 'STOCK_HIGH'>('REQUESTS');

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

  // Filtered & Sorted Tools for the Ranking Dashboard
  const filteredTools = useMemo(() => {
    const list = toolsRanking.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
        t.sku.toLowerCase().includes(toolSearch.toLowerCase()) ||
        t.topEmployee.toLowerCase().includes(toolSearch.toLowerCase()) ||
        t.topSector.toLowerCase().includes(toolSearch.toLowerCase());
      const matchCat = toolCategoryFilter === 'TODAS' || t.category === toolCategoryFilter;
      return matchSearch && matchCat;
    });

    return list.sort((a, b) => {
      if (toolSortBy === 'REQUESTS') return b.timesRequested - a.timesRequested;
      if (toolSortBy === 'QUANTITY') return b.totalQuantityUsed - a.totalQuantityUsed;
      if (toolSortBy === 'VALUE') return b.totalValueUsed - a.totalValueUsed;
      if (toolSortBy === 'STOCK_LOW') return a.currentStock - b.currentStock;
      if (toolSortBy === 'STOCK_HIGH') return b.currentStock - a.currentStock;
      return 0;
    });
  }, [toolsRanking, toolSearch, toolCategoryFilter, toolSortBy]);

  // Comprehensive Tool Ranking Statistics & KPIs
  const toolRankingStats = useMemo(() => {
    const totalRequests = toolsRanking.reduce((acc, t) => acc + t.timesRequested, 0);
    const totalUnitsOut = toolsRanking.reduce((acc, t) => acc + t.totalQuantityUsed, 0);
    const totalValueOut = toolsRanking.reduce((acc, t) => acc + t.totalValueUsed, 0);
    const inStock = toolsRanking.filter((t) => t.currentStock > 0).length;
    const outOfStock = toolsRanking.filter((t) => t.currentStock === 0).length;
    const lowStock = toolsRanking.filter((t) => t.currentStock > 0 && t.currentStock <= 2).length;
    const availabilityRate = toolsRanking.length > 0 ? Math.round((inStock / toolsRanking.length) * 100) : 100;
    return {
      totalRequests,
      totalUnitsOut,
      totalValueOut,
      inStock,
      outOfStock,
      lowStock,
      availabilityRate,
    };
  }, [toolsRanking]);

  // Top 6 tools for bar chart
  const topToolsChartData = useMemo(() => {
    return toolsRanking.slice(0, 6).map((t) => ({
      name: t.name.length > 14 ? t.name.slice(0, 13) + '…' : t.name,
      fullName: t.name,
      sku: t.sku,
      requisições: t.timesRequested,
      quantidade: t.totalQuantityUsed,
      saldo: t.currentStock,
    }));
  }, [toolsRanking]);

  // Category breakdown for tools
  const toolsCategoryBreakdown = useMemo(() => {
    const map: { [cat: string]: { count: number; requests: number; value: number } } = {};
    toolsRanking.forEach((t) => {
      const cat = t.category || 'Geral';
      if (!map[cat]) map[cat] = { count: 0, requests: 0, value: 0 };
      map[cat].count += 1;
      map[cat].requests += t.timesRequested;
      map[cat].value += t.totalValueUsed;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, value: data.requests, toolCount: data.count, totalVal: data.value }))
      .sort((a, b) => b.value - a.value);
  }, [toolsRanking]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
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
        <div
          onClick={() => onNavigateTab('employees')}
          className="p-4 bg-[#0D131F] border border-amber-500/25 rounded-2xl shadow-lg hover:border-amber-500/50 transition cursor-pointer hover:bg-[#121B2D]"
          title="Clique para gerenciar o cadastro de funcionários"
        >
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
        <div className="sm:col-span-2 md:col-span-3 xl:col-span-1 p-4 bg-[#0D131F] border border-red-500/30 rounded-2xl shadow-lg hover:border-red-500/60 transition">
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

      {/* 4. DASHBOARD DO RANKING DE FERRAMENTAS & EQUIPAMENTOS */}
      <div className="p-6 bg-[#0D131F] border border-amber-500/30 rounded-2xl shadow-xl space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-amber-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 rounded-xl border border-amber-500/40 shrink-0 shadow-inner">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-white tracking-tight">
                  Dashboard do Ranking de Ferramentas
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  {filteredTools.length} ferramentas catalogadas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
                Desempenho de rotação, frequência de saídas, disponibilidade física no almoxarifado e controle de cautelas.
              </p>
            </div>
          </div>

          {/* Quick Filters & Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                placeholder="Buscar por nome, SKU ou operador..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#111827] border border-amber-500/30 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* Category Select */}
            <select
              value={toolCategoryFilter}
              onChange={(e) => setToolCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#111827] border border-amber-500/30 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400 transition cursor-pointer"
            >
              <option value="TODAS">Todas Categorias</option>
              <option value="Ferramentas">Ferramentas Manuais/Elétricas</option>
              <option value="EPI">EPIs & Segurança</option>
              <option value="Elétrica">Materiais Elétricos</option>
              <option value="Hidráulica">Tubos & Conexões Hidráulicas</option>
              <option value="Civil / Obras">Construção Civil & Obras</option>
              <option value="Pintura">Pintura & Acabamento</option>
              <option value="Outros">Outros</option>
            </select>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-[#111827] border border-amber-500/30 rounded-xl px-2.5 py-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={toolSortBy}
                onChange={(e: any) => setToolSortBy(e.target.value)}
                className="text-xs bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="REQUESTS" className="bg-[#111827]">Mais Requisitadas (Giro)</option>
                <option value="QUANTITY" className="bg-[#111827]">Maior Quantidade Retirada</option>
                <option value="VALUE" className="bg-[#111827]">Maior Valor Financeiro</option>
                <option value="STOCK_LOW" className="bg-[#111827]">Menor Saldo (Ruptura)</option>
                <option value="STOCK_HIGH" className="bg-[#111827]">Maior Saldo em Estoque</option>
              </select>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => onOpenMovementModal('SAIDA')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md hover:shadow-amber-500/20 transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Nova Cautela</span>
            </button>
          </div>
        </div>

        {/* 4 Mini KPI Cards for Tool Ranking Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Líder do Ranking */}
          <div className="p-4 bg-[#111827] border border-amber-500/30 rounded-xl relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                🥇 Líder Absoluta
              </span>
              <span className="font-mono text-[10px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/40">
                #1 Ranking
              </span>
            </div>
            <div className="text-sm font-serif font-bold text-white truncate" title={topTool?.name || 'Nenhuma'}>
              {topTool ? topTool.name : 'Nenhuma saída'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{topTool ? `${topTool.timesRequested}x retiradas` : '-'}</span>
              <span className="font-mono text-emerald-400">{topTool ? `${topTool.currentStock} ${topTool.unit} em estoque` : ''}</span>
            </div>
          </div>

          {/* KPI 2: Total de Requisições */}
          <div className="p-4 bg-[#111827] border border-amber-500/30 rounded-xl relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span className="flex items-center gap-1 text-amber-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Total de Cautelas
              </span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                Giro Total
              </span>
            </div>
            <div className="text-xl font-serif font-bold text-white">
              {toolRankingStats.totalRequests}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">empréstimos</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Frequência acumulada no almoxarifado
            </div>
          </div>

          {/* KPI 3: Itens Retirados em Campo */}
          <div className="p-4 bg-[#111827] border border-amber-500/30 rounded-xl relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span className="flex items-center gap-1 text-amber-300">
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                Unidades em Operação
              </span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                Volume
              </span>
            </div>
            <div className="text-xl font-serif font-bold text-white">
              {toolRankingStats.totalUnitsOut}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">unidades</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Equipamentos entregues às equipes
            </div>
          </div>

          {/* KPI 4: Taxa de Disponibilidade */}
          <div className="p-4 bg-[#111827] border border-amber-500/30 rounded-xl relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Taxa de Pronta-Entrega
              </span>
              <span className="font-mono text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
                {toolRankingStats.availabilityRate}%
              </span>
            </div>
            <div className="text-xl font-serif font-bold text-emerald-400">
              {toolRankingStats.inStock}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">itens disponíveis</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {toolRankingStats.outOfStock > 0 ? (
                <span className="text-red-400 font-medium">{toolRankingStats.outOfStock} ferramentas zeradas</span>
              ) : (
                <span className="text-emerald-400">100% dos modelos com estoque</span>
              )}
            </div>
          </div>
        </div>

        {/* Podium: Top 3 Ferramentas Campeãs */}
        {filteredTools.length >= 1 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-slate-200 flex items-center gap-2">
                <span>Pódio de Destaque das Ferramentas</span>
                <span className="text-xs text-amber-400 font-mono font-normal">Top 3 mais utilizadas em obras</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1st Place - Gold */}
              {filteredTools[0] && (() => {
                const tool = filteredTools[0];
                const prod = products.find((p) => p.id === tool.productId);
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 via-[#131924] to-[#0D131F] border-2 border-amber-400/50 shadow-lg relative flex flex-col justify-between">
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500 text-slate-950 border border-amber-300 shadow-md">
                      🥇 1º LUGAR — CAMPEÃ
                    </div>
                    <div>
                      <div className="flex items-start gap-2.5 mt-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-base font-mono shadow-md shrink-0">
                          1º
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif font-bold text-sm text-white truncate" title={tool.name}>
                            {tool.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-mono text-[10px] border border-amber-500/40">
                              {tool.sku}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{tool.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[11px]">Requisições:</span>
                          <div className="font-bold text-amber-300 font-mono">{tool.timesRequested}x ({tool.totalQuantityUsed} {tool.unit})</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">Saldo no Almoxarifado:</span>
                          <div className={`font-bold font-mono ${tool.currentStock === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tool.currentStock} {tool.unit}
                          </div>
                        </div>
                        <div className="col-span-2 text-[11px] text-slate-300 truncate">
                          Requisitante principal: <strong className="text-white">{tool.topEmployee || 'Geral'}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (prod) onSelectProduct(prod);
                        onOpenMovementModal('SAIDA');
                      }}
                      className="mt-3.5 w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Emitir Cautela desta Ferramenta</span>
                    </button>
                  </div>
                );
              })()}

              {/* 2nd Place - Silver */}
              {filteredTools[1] && (() => {
                const tool = filteredTools[1];
                const prod = products.find((p) => p.id === tool.productId);
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-400/10 via-[#131924] to-[#0D131F] border border-slate-400/40 shadow-lg relative flex flex-col justify-between">
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-300 text-slate-900 border border-slate-200 shadow-md">
                      🥈 2º LUGAR
                    </div>
                    <div>
                      <div className="flex items-start gap-2.5 mt-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-300 text-slate-900 flex items-center justify-center font-bold text-base font-mono shadow-md shrink-0">
                          2º
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif font-bold text-sm text-white truncate" title={tool.name}>
                            {tool.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                              {tool.sku}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{tool.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[11px]">Requisições:</span>
                          <div className="font-bold text-slate-200 font-mono">{tool.timesRequested}x ({tool.totalQuantityUsed} {tool.unit})</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">Saldo no Almoxarifado:</span>
                          <div className={`font-bold font-mono ${tool.currentStock === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tool.currentStock} {tool.unit}
                          </div>
                        </div>
                        <div className="col-span-2 text-[11px] text-slate-300 truncate">
                          Requisitante principal: <strong className="text-white">{tool.topEmployee || 'Geral'}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (prod) onSelectProduct(prod);
                        onOpenMovementModal('SAIDA');
                      }}
                      className="mt-3.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-600 shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Wrench className="w-3 h-3 text-amber-400" />
                      <span>Emitir Cautela</span>
                    </button>
                  </div>
                );
              })()}

              {/* 3rd Place - Bronze */}
              {filteredTools[2] && (() => {
                const tool = filteredTools[2];
                const prod = products.find((p) => p.id === tool.productId);
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-800/20 via-[#131924] to-[#0D131F] border border-amber-700/40 shadow-lg relative flex flex-col justify-between">
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-800 text-amber-100 border border-amber-600 shadow-md">
                      🥉 3º LUGAR
                    </div>
                    <div>
                      <div className="flex items-start gap-2.5 mt-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-800 text-amber-100 flex items-center justify-center font-bold text-base font-mono shadow-md shrink-0">
                          3º
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif font-bold text-sm text-white truncate" title={tool.name}>
                            {tool.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                              {tool.sku}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{tool.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-amber-900/40 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[11px]">Requisições:</span>
                          <div className="font-bold text-amber-200 font-mono">{tool.timesRequested}x ({tool.totalQuantityUsed} {tool.unit})</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">Saldo no Almoxarifado:</span>
                          <div className={`font-bold font-mono ${tool.currentStock === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tool.currentStock} {tool.unit}
                          </div>
                        </div>
                        <div className="col-span-2 text-[11px] text-slate-300 truncate">
                          Requisitante principal: <strong className="text-white">{tool.topEmployee || 'Geral'}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (prod) onSelectProduct(prod);
                        onOpenMovementModal('SAIDA');
                      }}
                      className="mt-3.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-600 shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Wrench className="w-3 h-3 text-amber-400" />
                      <span>Emitir Cautela</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Visual Analytics Charts Grid for Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Chart 1: Top 6 Demanded Tools Bar Chart */}
          <div className="lg:col-span-2 p-4 bg-[#111827] border border-amber-500/25 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Comparativo de Demanda: Top Ferramentas
                </h4>
                <p className="text-[11px] text-slate-400">
                  Relação direta entre número de requisições e volume físico retirado (unidades)
                </p>
              </div>
              <span className="text-[11px] font-mono text-amber-400">Top 6 Mais Utilizadas</span>
            </div>

            <div className="h-56 w-full">
              {topToolsChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Nenhuma saída de ferramentas registrada até o momento.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topToolsChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      formatter={(val: any, name: string) => [
                        `${val} ${name.includes('Quantidade') ? 'unidades' : 'vezes'}`,
                        name === 'requisições' ? 'Requisições' : 'Quantidade Retirada',
                      ]}
                      labelFormatter={(_, arr) => arr[0]?.payload?.fullName || ''}
                      contentStyle={{
                        backgroundColor: '#0D131F',
                        borderColor: '#F59E0B55',
                        borderRadius: '10px',
                        color: '#F3F4F6',
                        fontSize: '12px',
                      }}
                    />
                    <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="requisições" name="Frequência (x)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="quantidade" name="Quantidade Total (un)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Category Distribution of Tool Usage */}
          <div className="p-4 bg-[#111827] border border-amber-500/25 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-serif font-bold text-sm text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Demandas por Categoria
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Proporção de retiradas por tipo de material
                  </p>
                </div>
              </div>

              <div className="h-44 w-full relative">
                {toolsCategoryBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Sem dados cadastrados.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={toolsCategoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {toolsCategoryBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: string) => [`${value} requisições`, name]}
                        contentStyle={{
                          backgroundColor: '#0D131F',
                          borderColor: '#F59E0B55',
                          borderRadius: '10px',
                          color: '#F3F4F6',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
              <span>Classificação por centro de aplicação</span>
              <span className="font-mono text-amber-400 font-bold">{toolsCategoryBreakdown.length} categorias</span>
            </div>
          </div>
        </div>

        {/* Full Interactive Tools Ranking Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-serif font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <span>Tabela Geral do Ranking de Ferramentas</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({filteredTools.length} registros correspondentes)
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('cautelas')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Gestão de Cautelas Ativas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-[#111827]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#182030] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-amber-500/20">
                <tr>
                  <th className="py-3 px-3.5 text-center">Posição</th>
                  <th className="py-3 px-3.5">Ferramenta & Código SKU</th>
                  <th className="py-3 px-3.5">Categoria</th>
                  <th className="py-3 px-3.5 text-center">Requisições</th>
                  <th className="py-3 px-3.5 text-center">Qtd. Retirada</th>
                  <th className="py-3 px-3.5">Principal Requisitante</th>
                  <th className="py-3 px-3.5 text-center">Saldo em Estoque</th>
                  <th className="py-3 px-3.5 text-right">Valor em Giro</th>
                  <th className="py-3 px-3.5 text-center">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTools.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      Nenhuma ferramenta encontrada com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredTools.map((tool, idx) => {
                    const prod = products.find((p) => p.id === tool.productId);
                    const isGold = idx === 0;
                    const isSilver = idx === 1;
                    const isBronze = idx === 2;

                    return (
                      <tr
                        key={tool.productId}
                        className={`hover:bg-[#1A2333] transition ${
                          isGold
                            ? 'bg-amber-500/5'
                            : isSilver
                            ? 'bg-slate-500/5'
                            : isBronze
                            ? 'bg-amber-900/10'
                            : ''
                        }`}
                      >
                        {/* Position */}
                        <td className="py-3 px-3.5 text-center font-mono font-bold">
                          {isGold ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-sm">
                              🥇
                            </span>
                          ) : isSilver ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-300 text-slate-900 font-bold text-xs shadow-sm">
                              🥈
                            </span>
                          ) : isBronze ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-800 text-amber-100 font-bold text-xs shadow-sm">
                              🥉
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">#{idx + 1}</span>
                          )}
                        </td>

                        {/* Name and SKU */}
                        <td className="py-3 px-3.5">
                          <div className="font-serif font-bold text-slate-100 text-xs sm:text-sm">
                            {tool.name}
                          </div>
                          <div className="font-mono text-[10px] text-amber-400/80">
                            {tool.sku}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                            {tool.category}
                          </span>
                        </td>

                        {/* Requests Count */}
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-amber-400">
                          {tool.timesRequested}x
                        </td>

                        {/* Quantity Used */}
                        <td className="py-3 px-3.5 text-center font-mono text-slate-200">
                          {tool.totalQuantityUsed} {tool.unit}
                        </td>

                        {/* Top Employee & Sector */}
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-200 truncate max-w-[150px]" title={tool.topEmployee}>
                            {tool.topEmployee || 'Almoxarifado Geral'}
                          </div>
                          {tool.topSector && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              Setor: {tool.topSector}
                            </div>
                          )}
                        </td>

                        {/* Stock Balance Status */}
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              tool.currentStock === 0
                                ? 'bg-red-950 text-red-300 border border-red-500/40'
                                : tool.currentStock <= 2
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                tool.currentStock === 0
                                  ? 'bg-red-400 animate-pulse'
                                  : tool.currentStock <= 2
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                            />
                            {tool.currentStock} {tool.unit}
                          </span>
                        </td>

                        {/* Value */}
                        <td className="py-3 px-3.5 text-right font-mono text-slate-200">
                          {formatCurrency(tool.totalValueUsed)}
                        </td>

                        {/* Action Button */}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => {
                              if (prod) onSelectProduct(prod);
                              onOpenMovementModal('SAIDA');
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-bold shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                            title="Emitir cautela ou saída desta ferramenta"
                          >
                            Cautela
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

        {/* Footer info & Navigation */}
        <div className="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Rastreabilidade em tempo real de equipamentos sob cautela e termos de responsabilidade.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('cautelas')}
              className="text-amber-400 hover:underline font-semibold cursor-pointer"
            >
              Abrir Painel de Cautelas →
            </button>
            <button
              onClick={() => onNavigateTab('movements')}
              className="text-slate-300 hover:text-white font-semibold cursor-pointer"
            >
              Auditoria de Saídas →
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
