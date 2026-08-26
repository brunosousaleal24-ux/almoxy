import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  Search,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
} from 'lucide-react';
import { KNOWLEDGE_BASE_TOPICS } from '../data/initialData';

export const KnowledgeBaseView: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState(KNOWLEDGE_BASE_TOPICS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Calculator State
  const [calcDailyDemand, setCalcDailyDemand] = useState<number>(10);
  const [calcLeadTime, setCalcLeadTime] = useState<number>(4);
  const [calcSafetyStock, setCalcSafetyStock] = useState<number>(15);

  const calculatedReorderPoint = calcDailyDemand * calcLeadTime + calcSafetyStock;

  const [calcAnnualExits, setCalcAnnualExits] = useState<number>(1200);
  const [calcAverageStock, setCalcAverageStock] = useState<number>(150);

  const calculatedStockTurnover = calcAverageStock > 0 ? (calcAnnualExits / calcAverageStock).toFixed(2) : '0';

  const filteredTopics = KNOWLEDGE_BASE_TOPICS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTopic = KNOWLEDGE_BASE_TOPICS.find((t) => t.id === selectedTopicId) || KNOWLEDGE_BASE_TOPICS[0];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Base de Conhecimento & Doutrina Operacional
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manual de boas práticas de almoxarifado, metodologias logísticas (Curva ABC, PEPS/FIFO, 5S) e calculadoras técnicas.
          </p>
        </div>
      </div>

      {/* Main Grid: Articles + Calculators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topics List */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar guias e diretrizes..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="space-y-2">
            {filteredTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition ${
                  selectedTopicId === topic.id
                    ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 border-amber-600 dark:border-amber-500 shadow-md'
                    : 'bg-white dark:bg-[#16191D] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#262B33] hover:bg-slate-50 dark:hover:bg-[#1E232B]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      selectedTopicId === topic.id
                        ? 'bg-black/20 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-[#1C2128] text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-[#2D3540]'
                    }`}
                  >
                    {topic.category}
                  </span>
                  <span className="text-[10px] opacity-80 font-mono">{topic.tag}</span>
                </div>
                <h4 className="font-serif font-bold text-sm mt-2">{topic.title}</h4>
                <p
                  className={`text-[11px] mt-1 line-clamp-2 ${
                    selectedTopicId === topic.id
                      ? 'text-white/90 dark:text-slate-900/90'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {topic.summary}
                </p>
              </button>
            ))}
          </div>

          {/* Interactive Calculator Box */}
          <div className="p-4 bg-[#121519] text-white rounded-2xl border border-[#2B323D] shadow-sm space-y-4 mt-6">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif font-bold text-sm text-[#F9FAFB]">Calculadora: Ponto de Pedido (PP)</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400">Consumo Diário Médio (unidades)</label>
                <input
                  type="number"
                  min="1"
                  value={calcDailyDemand}
                  onChange={(e) => setCalcDailyDemand(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#1C2128] border border-[#2D3540] rounded-lg text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400">Prazo Fornecedor / Lead Time (Dias)</label>
                <input
                  type="number"
                  min="1"
                  value={calcLeadTime}
                  onChange={(e) => setCalcLeadTime(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#1C2128] border border-[#2D3540] rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400">Estoque de Segurança (Margem)</label>
                <input
                  type="number"
                  min="0"
                  value={calcSafetyStock}
                  onChange={(e) => setCalcSafetyStock(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#1C2128] border border-[#2D3540] rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl mt-3 text-center">
                <span className="text-[10px] text-amber-300 block uppercase font-mono font-bold">Ponto de Pedido Recomendado</span>
                <span className="text-xl font-serif font-bold text-amber-400">{calculatedReorderPoint} unidades</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Disparar compra ao atingir este saldo físico.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Topic Content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30">
                {currentTopic.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">• {currentTopic.tag}</span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-[#F9FAFB]">
              {currentTopic.title}
            </h3>

            <div className="prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {currentTopic.content}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#14171A] rounded-xl border border-slate-200 dark:border-[#282E37] flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <span className="font-serif font-bold text-slate-900 dark:text-[#F9FAFB] block">Padrão Borges & Gomes de Excelência</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Todas as regras e metodologias acima estão embutidas nos algoritmos automatizados deste almoxarifado.
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Quick Calculator: Giro de Estoque */}
          <div className="p-5 bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm space-y-3">
            <h4 className="font-serif font-bold text-base text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Calculadora: Taxa de Giro de Estoque (Inventory Turnover)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Total de Saídas Anuais (Qtd)</label>
                <input
                  type="number"
                  value={calcAnnualExits}
                  onChange={(e) => setCalcAnnualExits(Number(e.target.value))}
                  className="w-full px-3 py-1.5 font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Estoque Médio Físico (Qtd)</label>
                <input
                  type="number"
                  value={calcAverageStock}
                  onChange={(e) => setCalcAverageStock(Number(e.target.value))}
                  className="w-full px-3 py-1.5 font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-[#141B17] border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-serif font-semibold">
                Índice de Giro Anual:
              </span>
              <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {calculatedStockTurnover}x / ano
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
