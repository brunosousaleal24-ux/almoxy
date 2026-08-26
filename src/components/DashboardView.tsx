import React from 'react';
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
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatDate } from '../utils/exportUtils';
import { Product } from '../types';

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
  const { products, movements, stats, alerts } = useInventory();

  // 1. Prepare Daily Trend Data (Last 7 Days)
  const last7DaysData = React.useMemo(() => {
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

  // 2. Prepare Category Valuation Distribution
  const categoryDistribution = React.useMemo(() => {
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

  // 3. Top Consumed / Moved Items
  const topConsumedItems = React.useMemo(() => {
    const usageMap: { [sku: string]: { name: string; quantity: number; cost: number } } = {};
    movements
      .filter((m) => m.type === 'SAIDA')
      .forEach((m) => {
        if (!usageMap[m.productSku]) {
          usageMap[m.productSku] = { name: m.productName, quantity: 0, cost: 0 };
        }
        usageMap[m.productSku].quantity += m.quantity;
        usageMap[m.productSku].cost += m.totalCost;
      });

    return Object.entries(usageMap)
      .map(([sku, data]) => ({
        sku,
        name: data.name.length > 20 ? data.name.slice(0, 18) + '...' : data.name,
        quantity: data.quantity,
        totalVal: data.cost,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [movements]);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner with Editorial Brand Lockup */}
      <div className="bg-gradient-to-r from-[#14171B] via-[#1A1E24] to-[#14171B] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-amber-500/20 dark:border-[#2C333D]">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Centro de Operações Borges & Gomes
              </span>
              <span className="text-[11px] font-mono text-slate-400">Tempo Real • 5S</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#F9FAFB]">
              Gestão Integrada de Almoxarifado
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 font-sans">
              Controle físico e financeiro de inventário, conferência por código de barras, curva ABC e reposição preventiva.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-dash-open-scanner"
              onClick={onOpenScanner}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold font-sans flex items-center gap-2 border border-amber-500/40 shadow-lg transition active:scale-95"
            >
              <Barcode className="w-4 h-4 text-amber-400" />
              Bipar Código (Câmera)
            </button>
            <button
              id="btn-dash-quick-entry"
              onClick={() => onOpenMovementModal('ENTRADA')}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition active:scale-95"
            >
              <ArrowDownRight className="w-4 h-4" />
              Dar Entrada (+ NF)
            </button>
            <button
              id="btn-dash-quick-exit"
              onClick={() => onOpenMovementModal('SAIDA')}
              className="px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-2 shadow-lg shadow-red-900/30 transition active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              Dar Saída (Requisição)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Valuation Card */}
        <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Valor do Patrimônio
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-900/60">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-[#F3F4F6] tracking-tight">
              {formatCurrency(stats.totalValuation)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono text-[11px]">{stats.totalSkus} SKUs catalogados</span>
            </div>
          </div>
        </div>

        {/* Total Physical Stock Card */}
        <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Itens no Galpão
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-[#F3F4F6] tracking-tight">
              {stats.totalItems.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400 font-sans">unidades</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">+{stats.entriesToday} entradas hoje</span>
            </div>
          </div>
        </div>

        {/* Exits Today Card */}
        <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm hover:border-red-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Saídas / Requisições
            </span>
            <div className="p-2 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/60">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-[#F3F4F6] tracking-tight">
              {stats.exitsToday} <span className="text-xs font-normal text-slate-400 font-sans">saídas</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-[11px]">{stats.movementsToday} movimentações hoje</span>
            </div>
          </div>
        </div>

        {/* Critical Low Stock Card */}
        <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Estoque Crítico
            </span>
            <div className={`p-2 rounded-lg border ${alerts.length > 0 ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'}`}>
              {alerts.length > 0 ? <AlertOctagon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-[#F3F4F6] tracking-tight">
              {stats.criticalStockCount + stats.lowStockCount}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">itens</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-red-600 dark:text-red-400 font-semibold">
              {stats.criticalStockCount > 0 ? (
                <span className="font-mono text-[11px]">{stats.criticalStockCount} em ruptura imediata (saldo 0)</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono text-[11px]">Estoque 100% abastecido</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Flow Chart: Daily Entries vs Exits Trend */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                Fluxo de Movimentação Diária
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Volume físico de Entradas vs Saídas registradas no almoxarifado
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('movements')}
              className="text-xs font-serif font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              Ver Tabela Completa →
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
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121519',
                    borderColor: '#2D3440',
                    borderRadius: '10px',
                    color: '#F3F4F6',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
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
                  name="Saídas (Qtd)"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSaidas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Valuation Donut Chart */}
        <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                Patrimônio por Categoria
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribuição do capital estocado
              </p>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{
                    backgroundColor: '#121519',
                    borderColor: '#2D3440',
                    borderRadius: '10px',
                    color: '#F3F4F6',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-slate-100 dark:border-[#232830]">
            {categoryDistribution.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                <span className="truncate text-[11px]">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Top Consumed Items Bar Chart & Critical Alerts Quick List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Demanded Items */}
        <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                Top 5 Itens Mais Requisitados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Itens com maior frequência de saída no período
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-serif font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              Curva ABC →
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topConsumedItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="sku" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`${val} unidades`, 'Total Requisitado']}
                  contentStyle={{
                    backgroundColor: '#121519',
                    borderColor: '#2D3440',
                    borderRadius: '10px',
                    color: '#F3F4F6',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <Bar dataKey="quantity" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Urgent Replenishment Action List */}
        <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-500" />
                  Necessidade Imediata de Reposição
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Produtos que atingiram ou romperam o ponto de pedido
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs font-serif font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Ver Todos ({alerts.length}) →
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum item com estoque baixo. Todos os saldos estão saudáveis.
                </div>
              ) : (
                alerts.slice(0, 4).map((alt) => {
                  const prod = products.find((p) => p.id === alt.productId);
                  return (
                    <div
                      key={alt.id}
                      className="p-3 bg-slate-50 dark:bg-[#1F242C] border border-slate-200 dark:border-[#2B323D] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              alt.type === 'CRITICO' ? 'bg-red-600 animate-ping' : 'bg-amber-500'
                            }`}
                          />
                          <span className="font-serif font-bold text-xs text-slate-900 dark:text-white">
                            {alt.productName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          Saldo: <strong className="text-red-500">{alt.currentStock}</strong> (Mín: {alt.minStock}) • Repor:{' '}
                          <strong className="text-amber-600 dark:text-amber-400">+{alt.suggestedReorderQuantity} un</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (prod) onSelectProduct(prod);
                          onOpenMovementModal('ENTRADA');
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-lg shadow-sm whitespace-nowrap transition"
                      >
                        Repor (+ NF)
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#232830] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Acuracidade Geral do Almoxarifado: <strong className="font-mono text-slate-700 dark:text-slate-300">{stats.stockAccuracyPercent}%</strong></span>
            <span className="text-amber-700 dark:text-amber-400 font-semibold font-serif">Padrão Borges & Gomes 5S</span>
          </div>
        </div>
      </div>
    </div>
  );
};
