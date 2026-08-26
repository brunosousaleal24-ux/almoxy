import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Save,
  Barcode,
  Package,
  Layers,
  MapPin,
  Truck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product, ProductCategory } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const CATEGORIES: ProductCategory[] = [
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

const UNITS: Array<'UN' | 'CX' | 'KG' | 'M' | 'L' | 'PAR' | 'RL' | 'PC'> = [
  'UN',
  'CX',
  'KG',
  'M',
  'L',
  'PAR',
  'RL',
  'PC',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit = null,
}) => {
  const { suppliers, addProduct, updateProduct } = useInventory();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Elétrica');
  const [unit, setUnit] = useState<'UN' | 'CX' | 'KG' | 'M' | 'L' | 'PAR' | 'RL' | 'PC'>('UN');
  const [currentStock, setCurrentStock] = useState<number | ''>(0);
  const [minStock, setMinStock] = useState<number | ''>(10);
  const [maxStock, setMaxStock] = useState<number | ''>(50);
  const [safetyStock, setSafetyStock] = useState<number | ''>(5);
  const [costPrice, setCostPrice] = useState<number | ''>(25.0);
  const [salePrice, setSalePrice] = useState<number | ''>(38.0);
  const [warehouse, setWarehouse] = useState('Galpão Principal');
  const [shelf, setShelf] = useState('A-01');
  const [level, setLevel] = useState('Nível 1');
  const [bin, setBin] = useState('Gaveta 01');
  const [supplierId, setSupplierId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name);
        setSku(productToEdit.sku);
        setBarcode(productToEdit.barcode);
        setDescription(productToEdit.description);
        setCategory(productToEdit.category);
        setUnit(productToEdit.unit);
        setCurrentStock(productToEdit.currentStock);
        setMinStock(productToEdit.minStock);
        setMaxStock(productToEdit.maxStock);
        setSafetyStock(productToEdit.safetyStock);
        setCostPrice(productToEdit.costPrice);
        setSalePrice(productToEdit.salePrice || '');
        setWarehouse(productToEdit.location.warehouse);
        setShelf(productToEdit.location.shelf);
        setLevel(productToEdit.location.level);
        setBin(productToEdit.location.bin || '');
        setSupplierId(productToEdit.supplierId);
        setBatchNumber(productToEdit.batchNumber || '');
        setExpiryDate(productToEdit.expiryDate || '');
      } else {
        // Defaults for new product
        setName('');
        const randNum = Math.floor(100 + Math.random() * 900);
        setSku(`BG-MAT-${randNum}`);
        setBarcode(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
        setDescription('');
        setCategory('Ferramentas');
        setUnit('UN');
        setCurrentStock(0);
        setMinStock(10);
        setMaxStock(50);
        setSafetyStock(5);
        setCostPrice(45.0);
        setSalePrice(68.0);
        setWarehouse('Galpão Principal');
        setShelf('B-02');
        setLevel('Nível 2');
        setBin('Gaveta 05');
        setSupplierId(suppliers[0]?.id || '');
        setBatchNumber('');
        setExpiryDate('');
      }
    }
  }, [isOpen, productToEdit, suppliers]);

  const generateRandomBarcode = () => {
    const random13 = `789${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setBarcode(random13);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !barcode.trim()) return;

    const selectedSup = suppliers.find((s) => s.id === supplierId) || suppliers[0];

    const productData = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim(),
      description: description.trim(),
      category,
      unit,
      currentStock: typeof currentStock === 'number' ? currentStock : 0,
      minStock: typeof minStock === 'number' ? minStock : 5,
      maxStock: typeof maxStock === 'number' ? maxStock : 50,
      safetyStock: typeof safetyStock === 'number' ? safetyStock : 2,
      costPrice: typeof costPrice === 'number' ? costPrice : 0,
      salePrice: typeof salePrice === 'number' ? salePrice : undefined,
      location: {
        warehouse,
        shelf,
        level,
        bin,
      },
      supplierId: selectedSup ? selectedSup.id : 'sup-1',
      supplierName: selectedSup ? selectedSup.name : 'Distribuidora Gomes & Cia',
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate || undefined,
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, productData);
    } else {
      addProduct(productData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#2C333E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#262B33] bg-slate-50 dark:bg-[#121519]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-[#F9FAFB]">
                  {productToEdit ? 'Editar Produto do Almoxarifado' : 'Cadastrar Novo Item no Estoque'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Borges & Gomes Almoxarifado • Cadastro Técnico e Endereçamento
                </p>
              </div>
            </div>
            <button
              id="btn-close-product-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#20252D] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto font-sans">
            {/* Row 1: Name and Description */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Material / Equipamento *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cabo de Cobre Flexível 2,5mm² ou Furadeira de Impacto"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição Técnica / Especificação
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Norma NBR, especificações elétricas, acabamento..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Row 2: SKU, Barcode, Category, Unit */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código SKU Interno *
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="BG-EL-001"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500/60 uppercase font-bold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cód. Barras (EAN-13) *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomBarcode}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Gerar
                  </button>
                </div>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="789..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unidade *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as typeof unit)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Stock Levels */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#14171A] border border-slate-200 dark:border-[#282E37] rounded-xl">
              <span className="text-xs font-serif font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 mb-2.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Parâmetros de Controle de Estoque
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono font-bold bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Estoque Mínimo (Ponto de Pedido) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Estoque Máximo
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={maxStock}
                    onChange={(e) => setMaxStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Estoque de Segurança
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={safetyStock}
                    onChange={(e) => setSafetyStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Pricing & Costs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preço de Custo Unitário (R$) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preço / Valor Contábil de Referência (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Row 5: Physical Warehouse Location */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#14171A] border border-slate-200 dark:border-[#282E37] rounded-xl">
              <span className="text-xs font-serif font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 mb-2.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                Endereçamento Físico no Almoxarifado
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Galpão / Armazém
                  </label>
                  <input
                    type="text"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Rua / Prateleira
                  </label>
                  <input
                    type="text"
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    placeholder="A-01"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nível / Altura
                  </label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="Nível 2"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Gaveta / Vão
                  </label>
                  <input
                    type="text"
                    value={bin}
                    onChange={(e) => setBin(e.target.value)}
                    placeholder="Gaveta 04"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Supplier and Batch/Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-500" /> Fornecedor Principal
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tradeName || s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lote de Fabricação
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="Ex: LT-2026-08"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Data de Validade
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#262B33]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-save-product-form"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95"
              >
                {productToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {productToEdit ? 'Salvar Alterações' : 'Cadastrar Item'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
