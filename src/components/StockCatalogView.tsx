import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  FileText,
  Barcode,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  MapPin,
  Tag,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Printer,
  X,
  Package,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product, ProductCategory, StockStatus } from '../types';
import { formatCurrency, exportInventoryToExcel, formatDate } from '../utils/exportUtils';

interface StockCatalogViewProps {
  onOpenProductModal: (product?: Product) => void;
  onOpenMovementModal: (product: Product, type: 'ENTRADA' | 'SAIDA') => void;
}

const CATEGORIES: Array<ProductCategory | 'TODAS'> = [
  'TODAS',
  'Ferramentas',
  'Elétrica',
  'Hidráulica',
  'EPIs & Segurança',
  'Fixação & Parafusos',
  'Químicos & Tintas',
  'Material de Escritório',
  'Peças & Mecânica',
  'Construção Civil',
  'Diversos',
];

export const StockCatalogView: React.FC<StockCatalogViewProps> = ({
  onOpenProductModal,
  onOpenMovementModal,
}) => {
  const { products, deleteProduct, settings } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'TODAS'>('TODAS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICO' | 'BAIXO' | 'NORMAL'>('ALL');
  const [labelModalProduct, setLabelModalProduct] = useState<Product | null>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.location.shelf.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = selectedCategory === 'TODAS' || p.category === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === 'CRITICO') matchesStatus = p.currentStock === 0;
    else if (statusFilter === 'BAIXO') matchesStatus = p.currentStock > 0 && p.currentStock <= p.minStock;
    else if (statusFilter === 'NORMAL') matchesStatus = p.currentStock > p.minStock;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${name}" do almoxarifado?`)) {
      deleteProduct(id);
    }
  };

  const handlePrintLabel = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-[#F9FAFB] tracking-tight">
            Catálogo & Controle de Estoque Físico
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Listagem oficial de insumos, endereçamento logístico e saldos em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Excel */}
          <button
            id="btn-export-inventory-excel"
            onClick={() => exportInventoryToExcel(products, settings.companyName)}
            className="px-3.5 py-2 bg-slate-900 dark:bg-[#1A1F26] hover:bg-slate-800 dark:hover:bg-[#232A34] text-slate-200 hover:text-white border border-slate-700/60 dark:border-[#2F3744] text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            title="Exportar inventário completo em formato Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          {/* Add Product Button */}
          <button
            id="btn-add-product"
            onClick={() => onOpenProductModal()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold font-sans rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-900/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-search-inventory"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por SKU, EAN, Descrição ou Prateleira..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 font-sans"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60 font-sans"
            >
              <option value="ALL">Todos os Níveis de Estoque</option>
              <option value="CRITICO">🚨 Ruptura / Estoque Zerado (0)</option>
              <option value="BAIXO">⚠️ Estoque Baixo (Abaixo do Mínimo)</option>
              <option value="NORMAL">✅ Saldo Normal / Abastecido</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-slate-100 dark:bg-[#1C2128] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#252B35] font-medium'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#262B33] bg-slate-50 dark:bg-[#13161A] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Item / Código</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4 text-center">Saldo Físico</th>
                <th className="py-3.5 px-4 text-center">Mín / Máx</th>
                <th className="py-3.5 px-4 text-right">Custo Unit.</th>
                <th className="py-3.5 px-4 text-right">Total Estocado</th>
                <th className="py-3.5 px-4">Endereçamento</th>
                <th className="py-3.5 px-4 text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21262E] text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const totalVal = p.currentStock * p.costPrice;
                  const isCritical = p.currentStock === 0;
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#1C2128]/70 transition group"
                    >
                      {/* Name, SKU & Barcode */}
                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-slate-900 dark:text-[#F3F4F6] text-sm">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span className="font-bold text-amber-600 dark:text-amber-400">{p.sku}</span>
                          <span>•</span>
                          <span>EAN: {p.barcode}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-[#1E232B] text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-[#2C333E]">
                          {p.category}
                        </span>
                      </td>

                      {/* Stock Balance with Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                            isCritical
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-900/60'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-900/60'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900/60'
                          }`}
                        >
                          {isCritical && <AlertTriangle className="w-3 h-3" />}
                          <span>
                            {p.currentStock} {p.unit}
                          </span>
                        </div>
                        {isCritical && (
                          <span className="block text-[10px] text-red-600 dark:text-red-400 font-bold mt-0.5">RUPTURA</span>
                        )}
                        {isLow && (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">ABAIXO MÍN</span>
                        )}
                      </td>

                      {/* Min / Max */}
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {p.minStock} / {p.maxStock} {p.unit}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(p.costPrice)}
                      </td>

                      {/* Total Valuation */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-[#F3F4F6]">
                        {formatCurrency(totalVal)}
                      </td>

                      {/* Warehouse Location */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{p.location.shelf} ({p.location.level})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{p.location.warehouse}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick Entry (+) */}
                          <button
                            onClick={() => onOpenMovementModal(p, 'ENTRADA')}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition"
                            title="Dar Entrada Rápida (+)"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>

                          {/* Quick Exit (-) */}
                          <button
                            onClick={() => onOpenMovementModal(p, 'SAIDA')}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                            title="Dar Saída Rápida (-)"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          {/* Print Label */}
                          <button
                            onClick={() => setLabelModalProduct(p)}
                            className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition"
                            title="Gerar e Imprimir Etiqueta c/ Código de Barras"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onOpenProductModal(p)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Editar Dados do Produto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-[#13161A] border-t border-slate-200 dark:border-[#262B33] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
          <span>Exibindo <strong className="font-mono text-slate-800 dark:text-slate-200">{filteredProducts.length}</strong> de {products.length} produtos cadastrados</span>
          <span>
            Patrimônio Filtrado:{' '}
            <strong className="text-slate-900 dark:text-[#F3F4F6] font-mono font-bold">
              {formatCurrency(filteredProducts.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0))}
            </strong>
          </span>
        </div>
      </div>

      {/* Printable Barcode Label Modal */}
      {labelModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#2F3744] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#262B33] pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                  Etiqueta de Almoxarifado
                </h3>
              </div>
              <button
                onClick={() => setLabelModalProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Printable Label Box */}
            <div className="p-4 border-2 border-dashed border-amber-500/30 rounded-xl bg-slate-50 dark:bg-[#121519] text-center space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 block font-serif">
                BORGES & GOMES • ALMOXARIFADO
              </span>
              <h4 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                {labelModalProduct.name}
              </h4>
              <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                SKU: {labelModalProduct.sku}
              </p>

              {/* Barcode Visual Strips Simulation */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="h-14 w-60 bg-slate-900 dark:bg-white flex items-center justify-center p-1 rounded">
                  <div className="flex items-center justify-between w-full h-full bg-white dark:bg-slate-950 px-2">
                    {Array.from({ length: 45 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-full ${
                          i % 3 === 0
                            ? 'w-1 bg-black dark:bg-white'
                            : i % 2 === 0
                            ? 'w-0.5 bg-black dark:bg-white'
                            : 'w-1.5 bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="font-mono text-xs tracking-widest mt-1 font-bold text-slate-800 dark:text-slate-200">
                  {labelModalProduct.barcode}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-[#262B33] pt-2 font-mono">
                Local: <strong>{labelModalProduct.location.shelf} - {labelModalProduct.location.level}</strong> ({labelModalProduct.location.warehouse})
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setLabelModalProduct(null)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              >
                Fechar
              </button>
              <button
                onClick={handlePrintLabel}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Imprimir Etiqueta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
