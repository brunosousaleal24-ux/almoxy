import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Barcode,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  MapPin,
  AlertTriangle,
  SlidersHorizontal,
  Printer,
  X,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product, ProductCategory } from '../types';
import { formatCurrency, exportInventoryToExcel } from '../utils/exportUtils';
import { BarcodeVisual } from './BarcodeVisual';

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
  const { products, deleteProduct, deleteProductsBulk, clearAllProducts, settings } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'TODAS'>('TODAS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICO' | 'BAIXO' | 'NORMAL'>('ALL');
  const [labelModalProduct, setLabelModalProduct] = useState<Product | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Filter products in real time by name, SKU, category, barcode, shelf, etc.
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.location?.shelf && p.location.shelf.toLowerCase().includes(term)) ||
      (p.location?.warehouse && p.location.warehouse.toLowerCase().includes(term)) ||
      (p.supplier && p.supplier.toLowerCase().includes(term));

    const matchesCat = selectedCategory === 'TODAS' || p.category === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === 'CRITICO') matchesStatus = p.currentStock === 0;
    else if (statusFilter === 'BAIXO') matchesStatus = p.currentStock > 0 && p.currentStock <= p.minStock;
    else if (statusFilter === 'NORMAL') matchesStatus = p.currentStock > p.minStock;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredProducts.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredProducts.map((p) => p.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    deleteProductsBulk(selectedIds);
    setSelectedIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  const handleClearAll = () => {
    clearAllProducts();
    setSelectedIds([]);
    setIsClearAllModalOpen(false);
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const totalFilteredValuation = filteredProducts.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);
  const totalFilteredStock = filteredProducts.reduce((sum, p) => sum + p.currentStock, 0);
  const criticalCount = filteredProducts.filter((p) => p.currentStock === 0).length;
  const lowCount = filteredProducts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-[#F9FAFB] tracking-tight">
            Catálogo & Controle de Estoque Físico
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Listagem oficial de insumos, endereçamento logístico e saldos em tempo real com leitor de código de barras e gestão total de exclusão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selected Bulk Delete */}
          {selectedIds.length > 0 && (
            <button
              id="btn-delete-selected-products"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-red-950/20 transition active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Apagar Selecionados ({selectedIds.length})</span>
            </button>
          )}

          {/* Clear All Products */}
          {products.length > 0 && (
            <button
              id="btn-clear-all-products"
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-red-500/10 text-slate-600 hover:text-red-500 dark:bg-[#1A1F26] dark:hover:bg-red-950/30 dark:text-slate-400 dark:hover:text-red-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2F3744] transition cursor-pointer"
              title="Apagar todo o catálogo de produtos"
            >
              Limpar Catálogo
            </button>
          )}

          {/* Export to Excel */}
          <button
            id="btn-export-inventory-excel"
            onClick={() => exportInventoryToExcel(products, settings.companyName)}
            className="px-3.5 py-2 bg-slate-900 dark:bg-[#1A1F26] hover:bg-slate-800 dark:hover:bg-[#232A34] text-slate-200 hover:text-white border border-slate-700/60 dark:border-[#2F3744] text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Exportar inventário completo em formato Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          {/* Add Product Button */}
          <button
            id="btn-add-product"
            onClick={() => onOpenProductModal()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold font-sans rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-900/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Proportional KPI Quick Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-[#121620] border border-slate-200 dark:border-amber-500/20 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Itens Filtrados</span>
          <div className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white mt-0.5">
            {filteredProducts.length} <span className="text-xs font-normal text-slate-400 font-sans">de {products.length} SKUs</span>
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-[#121620] border border-slate-200 dark:border-emerald-500/20 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Unidades Físicas</span>
          <div className="text-lg sm:text-xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {totalFilteredStock.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400 font-sans">unidades</span>
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-[#121620] border border-slate-200 dark:border-amber-500/20 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Valor em Estoque</span>
          <div className="text-lg sm:text-xl font-serif font-bold text-amber-600 dark:text-amber-300 mt-0.5">
            {formatCurrency(totalFilteredValuation)}
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-[#121620] border border-slate-200 dark:border-red-500/20 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Atenção & Rupturas</span>
          <div className="text-lg sm:text-xl font-serif font-bold text-red-500 dark:text-red-400 mt-0.5">
            {criticalCount + lowCount} <span className="text-xs font-normal text-slate-400 font-sans">({criticalCount} zerados)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Real-time Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-search-inventory"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar produtos por Nome, SKU ou Categoria..."
              className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 font-sans transition"
            />
            {searchTerm && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-md">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'}
                </span>
                <button
                  type="button"
                  id="btn-clear-search-term"
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2.5 px-3 text-xs bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60 font-sans cursor-pointer"
            >
              <option value="ALL">Todos os Níveis de Estoque</option>
              <option value="CRITICO">🚨 Ruptura / Estoque Zerado (0)</option>
              <option value="BAIXO">⚠️ Estoque Baixo (Abaixo do Mínimo)</option>
              <option value="NORMAL">✅ Saldo Normal / Abastecido</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills & Active Filter Status */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'bg-slate-100 dark:bg-[#1C2128] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#252B35] font-medium'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {(searchTerm || selectedCategory !== 'TODAS' || statusFilter !== 'ALL') && (
            <button
              type="button"
              id="btn-reset-all-filters"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('TODAS');
                setStatusFilter('ALL');
              }}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-[#16191D] border border-slate-200/90 dark:border-[#262B33] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#262B33] bg-slate-50 dark:bg-[#13161A] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-amber-500 transition cursor-pointer"
                    title={allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
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
                  <td colSpan={9} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2.5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1E232B] flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Nenhum produto encontrado
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {searchTerm
                            ? `Nenhum resultado corresponde à busca "${searchTerm}".`
                            : 'Nenhum produto corresponde aos filtros selecionados.'}
                        </p>
                      </div>
                      {(searchTerm || selectedCategory !== 'TODAS' || statusFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('TODAS');
                            setStatusFilter('ALL');
                          }}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 mt-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Limpar busca e filtros</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const totalVal = p.currentStock * p.costPrice;
                  const isCritical = p.currentStock === 0;
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#1C2128]/70 transition group ${
                        isSelected ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(p.id)}
                          className="text-slate-400 hover:text-amber-500 transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

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
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition cursor-pointer"
                            title="Dar Entrada Rápida (+)"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>

                          {/* Quick Exit (-) */}
                          <button
                            onClick={() => onOpenMovementModal(p, 'SAIDA')}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition cursor-pointer"
                            title="Dar Saída Rápida (-)"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          {/* Print Label */}
                          <button
                            onClick={() => setLabelModalProduct(p)}
                            className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition cursor-pointer"
                            title="Gerar e Imprimir Etiqueta c/ Código de Barras"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onOpenProductModal(p)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Editar Dados do Produto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition cursor-pointer"
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

      {/* Printable Barcode Label Modal with True Barcode */}
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
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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

              {/* Real SVG Scannable Barcode */}
              <div className="py-2 flex flex-col items-center justify-center">
                <BarcodeVisual
                  value={labelModalProduct.barcode || labelModalProduct.sku}
                  format="CODE128"
                  width={1.6}
                  height={52}
                  fontSize={12}
                  className="bg-white p-2 rounded-lg shadow-inner"
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-[#262B33] pt-2 font-mono">
                Local: <strong>{labelModalProduct.location.shelf} - {labelModalProduct.location.level}</strong> ({labelModalProduct.location.warehouse})
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setLabelModalProduct(null)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={handlePrintLabel}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir Etiqueta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Product Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#16191D] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                Excluir Produto
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tem certeza que deseja apagar <strong>{productToDelete.name}</strong> (SKU: {productToDelete.sku}) do estoque?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-[#1C2128] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-[#252C36] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Produto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#16191D] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                Excluir {selectedIds.length} Produtos
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tem certeza que deseja apagar os <strong>{selectedIds.length}</strong> produtos selecionados do almoxarifado?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-[#1C2128] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-[#252C36] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Exclusão em Massa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Products Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#16191D] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                Limpar Todo o Catálogo
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Atenção: Esta ação apagará <strong>todos os produtos cadastrados ({products.length})</strong> no sistema. Deseja continuar?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-[#1C2128] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-[#252C36] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Limpar Todo o Catálogo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
