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
  const [category, setCategory] = useState<ProductCategory>('Ferramentas');
  const [unit, setUnit] = useState<'UN' | 'CX' | 'KG' | 'M' | 'L' | 'PAR' | 'RL' | 'PC'>('UN');
  const [currentStock, setCurrentStock] = useState<number | ''>(0);
  const [minStock, setMinStock] = useState<number | ''>(10);
  const [maxStock, setMaxStock] = useState<number | ''>(50);
  const [safetyStock, setSafetyStock] = useState<number | ''>(5);
  const [costPrice, setCostPrice] = useState<number | ''>(0);
  const [salePrice, setSalePrice] = useState<number | ''>(0);
  const [warehouse, setWarehouse] = useState('Almoxarifado Principal');
  const [shelf, setShelf] = useState('');
  const [level, setLevel] = useState('');
  const [bin, setBin] = useState('');
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
        // Defaults for new product (clean)
        setName('');
        const randNum = Math.floor(100 + Math.random() * 900);
        setSku(`MAT-${randNum}`);
        setBarcode(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
        setDescription('');
        setCategory('Ferramentas');
        setUnit('UN');
        setCurrentStock(0);
        setMinStock(5);
        setMaxStock(50);
        setSafetyStock(2);
        setCostPrice(0);
        setSalePrice(0);
        setWarehouse('Almoxarifado Principal');
        setShelf('');
        setLevel('');
        setBin('');
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
      currentStock: currentStock === '' ? 0 : Number(currentStock),
      minStock: minStock === '' ? 5 : Number(minStock),
      maxStock: maxStock === '' ? 50 : Number(maxStock),
      safetyStock: safetyStock === '' ? 2 : Number(safetyStock),
      costPrice: costPrice === '' ? 0 : Number(costPrice),
      salePrice: salePrice === '' ? 0 : Number(salePrice),
      location: {
        warehouse: warehouse.trim() || 'Almoxarifado Principal',
        shelf: shelf.trim() || 'A-01',
        level: level.trim() || 'Nível 1',
        bin: bin.trim() || undefined,
      },
      supplierId: selectedSup ? selectedSup.id : 'sup-padrao',
      supplierName: selectedSup ? selectedSup.name : 'Fornecedor Padrão',
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#16191E] border border-slate-200 dark:border-[#2C333E] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#262B33]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-[#F9FAFB]">
                  {productToEdit ? 'Editar Cadastro de Item' : 'Novo Cadastro no Almoxarifado'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Código de barras EAN-13, SKU oficial, endereçamento logístico e parâmetros de estoque.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#20252D] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto font-sans text-xs">
            {/* Row 1: Name & SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição Completa do Material / Equipamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Furadeira de Impacto 1/2 Pol 750W 220V"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código SKU *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MAT-010"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Row 2: Barcode & Category & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código de Barras (EAN-13) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="7890000000000"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={generateRandomBarcode}
                    title="Gerar EAN-13 aleatório"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 p-1"
                  >
                    <Barcode className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unidade de Medida *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u} (
                      {u === 'UN'
                        ? 'Unidade'
                        : u === 'CX'
                        ? 'Caixa'
                        : u === 'KG'
                        ? 'Quilograma'
                        : u === 'M'
                        ? 'Metro'
                        : u === 'L'
                        ? 'Litro'
                        : u === 'PAR'
                        ? 'Par'
                        : u === 'RL'
                        ? 'Rolo'
                        : 'Peça'}
                      )
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Quantities and Levels */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#111317] border border-slate-200/80 dark:border-[#262B33] rounded-xl space-y-2.5">
              <div className="font-serif font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Parâmetros de Estoque & Limites de Reposição</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Saldo Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={currentStock}
                    onChange={(e) =>
                      setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={minStock}
                    onChange={(e) =>
                      setMinStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Estoque Máximo
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={maxStock}
                    onChange={(e) =>
                      setMaxStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Est. de Segurança
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={safetyStock}
                    onChange={(e) =>
                      setSafetyStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Valuation Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preço de Custo Unitário (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) =>
                      setCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preço de Venda / Repasse (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) =>
                      setSalePrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Logistics Address */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#111317] border border-slate-200/80 dark:border-[#262B33] rounded-xl space-y-2.5">
              <div className="font-serif font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Endereçamento Logístico no Galpão</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Galpão / Depósito
                  </label>
                  <input
                    type="text"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    placeholder="Almoxarifado Principal"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Prateleira / Rua
                  </label>
                  <input
                    type="text"
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    placeholder="Ex: A-01"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Nível / Andar
                  </label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="Ex: Nível 1"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                    Gaveta / Divisória
                  </label>
                  <input
                    type="text"
                    value={bin}
                    onChange={(e) => setBin(e.target.value)}
                    placeholder="Ex: Gaveta 01"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Supplier and Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fornecedor Vinculado
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {suppliers.length === 0 ? (
                    <option value="">Sem fornecedor cadastrado</option>
                  ) : (
                    suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nº do Lote (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: LOT-2026-08"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Validade (PEPS)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#262B33] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#20252D] rounded-xl font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition active:scale-95 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar no Catálogo</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
