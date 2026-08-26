import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  FileText,
  User,
  Building,
  DollarSign,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useInventory } from '../context/InventoryContext';
import { Product, MovementType, MovementReason } from '../types';
import { formatCurrency } from '../utils/exportUtils';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  initialType?: MovementType;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  initialProduct = null,
  initialType = 'ENTRADA',
}) => {
  const { products, registerMovement } = useInventory();

  const [type, setType] = useState<MovementType>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState<MovementReason>('COMPRA_NF');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [requesterSector, setRequesterSector] = useState<string>('Obra / Produção');
  const [operatorName, setOperatorName] = useState<string>('Carlos Borges');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial product and initial type when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setSelectedProductId(initialProduct.id);
        setProductSearch(initialProduct.name);
        setUnitCost(initialProduct.costPrice);
      } else if (products.length > 0) {
        setSelectedProductId(products[0].id);
        setProductSearch('');
        setUnitCost(products[0].costPrice);
      }
      setType(initialType);
      setReason(initialType === 'ENTRADA' ? 'COMPRA_NF' : initialType === 'SAIDA' ? 'REQUISICAO_SETOR' : 'INVENTARIO_CORRECAO');
      setQuantity(1);
      setDocumentNumber('');
      setNotes('');
      setErrorMessage(null);
    }
  }, [isOpen, initialProduct, initialType, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Update reason when type changes
  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    if (newType === 'ENTRADA') {
      setReason('COMPRA_NF');
      setRequesterSector('Compras / Almoxarifado');
    } else if (newType === 'SAIDA') {
      setReason('REQUISICAO_SETOR');
      setRequesterSector('Obra / Produção');
    } else if (newType === 'AJUSTE') {
      setReason('INVENTARIO_CORRECAO');
      setRequesterSector('Auditoria de Estoque');
    } else {
      setReason('TRANSFERENCIA_LOCAL');
      setRequesterSector('Galpão Secundário');
    }
  };

  const handleProductSelect = (prod: Product) => {
    setSelectedProductId(prod.id);
    setProductSearch(prod.name);
    setUnitCost(prod.costPrice);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch)
  );

  // Compute resulting stock preview
  const numQty = typeof quantity === 'number' ? quantity : 0;
  const currentStock = selectedProduct ? selectedProduct.currentStock : 0;
  let resultingStock = currentStock;
  if (type === 'ENTRADA') resultingStock = currentStock + numQty;
  else if (type === 'SAIDA') resultingStock = currentStock - numQty;
  else if (type === 'AJUSTE') resultingStock = numQty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProductId) {
      setErrorMessage('Selecione um produto do catálogo.');
      return;
    }

    if (quantity === '' || quantity <= 0) {
      setErrorMessage('Informe uma quantidade válida maior que zero.');
      return;
    }

    if (type === 'SAIDA' && currentStock < numQty) {
      setErrorMessage(
        `Saldo insuficiente em estoque! Disponível: ${currentStock} ${selectedProduct?.unit}, Solicitado: ${numQty}.`
      );
      return;
    }

    const result = registerMovement({
      productId: selectedProductId,
      type,
      reason,
      quantity: Number(quantity),
      documentNumber,
      requesterSector,
      operatorName,
      notes,
      unitCost: typeof unitCost === 'number' ? unitCost : undefined,
    });

    if (result.success) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Safe fallback
      }
      onClose();
    } else {
      setErrorMessage(result.error || 'Erro ao registrar movimentação.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#2C333E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#262B33] bg-slate-50 dark:bg-[#121519]">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : type === 'SAIDA'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {type === 'ENTRADA' && <ArrowDownRight className="w-5 h-5" />}
                {type === 'SAIDA' && <ArrowUpRight className="w-5 h-5" />}
                {type === 'AJUSTE' && <Sliders className="w-5 h-5" />}
                {type === 'TRANSFERENCIA' && <RefreshCw className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-[#F9FAFB]">
                  Registrar Movimentação de Estoque
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Borges & Gomes Almoxarifado • Controle com Rastreabilidade
                </p>
              </div>
            </div>
            <button
              id="btn-close-movement-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#20252D] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto font-sans">
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Movement Type Selector Tabs */}
            <div className="grid grid-cols-4 gap-2 p-1 bg-slate-100 dark:bg-[#1C2128] rounded-xl border border-slate-200/50 dark:border-[#2A303A]">
              <button
                type="button"
                id="tab-mov-entrada"
                onClick={() => handleTypeChange('ENTRADA')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Entrada
              </button>
              <button
                type="button"
                id="tab-mov-saida"
                onClick={() => handleTypeChange('SAIDA')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  type === 'SAIDA'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Saída
              </button>
              <button
                type="button"
                id="tab-mov-ajuste"
                onClick={() => handleTypeChange('AJUSTE')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  type === 'AJUSTE'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Ajuste
              </button>
              <button
                type="button"
                id="tab-mov-transf"
                onClick={() => handleTypeChange('TRANSFERENCIA')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  type === 'TRANSFERENCIA'
                    ? 'bg-slate-700 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Transf.
              </button>
            </div>

            {/* Product Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans">
                Produto do Almoxarifado *
              </label>
              <div className="relative">
                <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Digite nome, SKU ou código de barras para filtrar..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60 font-sans"
                />
              </div>

              {/* Quick product dropdown / picker */}
              <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-[#2A303A] rounded-xl p-1 divide-y divide-slate-100 dark:divide-[#21262E] bg-white dark:bg-[#14171B]">
                {filteredProducts.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => handleProductSelect(p)}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between rounded-lg transition ${
                      selectedProductId === p.id
                        ? 'bg-amber-500/20 text-amber-300 font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1E232B] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold mr-1.5 font-mono text-amber-600 dark:text-amber-400">[{p.sku}]</span>
                      <span className="font-serif">{p.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Saldo: <strong>{p.currentStock} {p.unit}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Stock Transition Banner */}
            {selectedProduct && (
              <div className="p-3 bg-slate-50 dark:bg-[#14171A] border border-slate-200 dark:border-[#282E37] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Estoque Atual:</span>
                  <p className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                    {currentProductStockText(selectedProduct)}
                  </p>
                </div>
                <div className="text-center font-bold text-amber-500">→</div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {type === 'AJUSTE' ? 'Nova Contagem Física:' : 'Saldo Resultante:'}
                  </span>
                  <p
                    className={`text-xs font-mono font-bold ${
                      resultingStock <= selectedProduct.minStock
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {resultingStock} {selectedProduct.unit}
                  </p>
                </div>
              </div>
            )}

            {/* Quantity and Cost Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {type === 'AJUSTE' ? 'Nova Quantidade Contada *' : 'Quantidade *'}
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  placeholder="Ex: 5"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Finalidade *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as MovementReason)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                >
                  {type === 'ENTRADA' && (
                    <>
                      <option value="COMPRA_NF">Compra c/ Nota Fiscal</option>
                      <option value="DEVOLUCAO">Devolução de Material</option>
                      <option value="SALDO_INICIAL">Saldo Inicial de Catálogo</option>
                      <option value="PRODUCAO">Entrada de Fabricação</option>
                    </>
                  )}
                  {type === 'SAIDA' && (
                    <>
                      <option value="REQUISICAO_SETOR">Requisição de Setor/Obra</option>
                      <option value="CONSUMO_INTERNO">Consumo Interno</option>
                      <option value="MANUTENCAO">Manutenção Preventiva/Corretiva</option>
                      <option value="OBRA_SERVICO">Obra / Prestação de Serviço</option>
                      <option value="PERDA_AVARIA">Avaria / Quebra / Perda</option>
                      <option value="DESCARTE">Descarte / Sucata</option>
                    </>
                  )}
                  {type === 'AJUSTE' && (
                    <>
                      <option value="INVENTARIO_CORRECAO">Contagem Rotativa / Inventário</option>
                      <option value="PERDA_AVARIA">Ajuste por Avaria</option>
                    </>
                  )}
                  {type === 'TRANSFERENCIA' && (
                    <>
                      <option value="TRANSFERENCIA_LOCAL">Transferência entre Galpões</option>
                      <option value="REQUISICAO_SETOR">Transferência p/ Canteiro de Obras</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custo Unit. (R$)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>
            </div>

            {/* Document and Requester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nº Documento / NF / Ordem de Serviço
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Ex: NF-99412 ou OS-2026/45"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Setor Requisitante / Destino
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={requesterSector}
                    onChange={(e) => setRequesterSector(e.target.value)}
                    placeholder="Ex: Obra Alpha, Elétrica, Mecânica..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>
            </div>

            {/* Operator and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operador / Responsável *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    required
                    placeholder="Nome do almoxarife"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações Adicionais
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Lote conferido, item de reposição urgente..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Footer Buttons */}
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
                id="btn-confirm-movement"
                className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-md transition active:scale-95 ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-700 hover:bg-emerald-600'
                    : type === 'SAIDA'
                    ? 'bg-red-700 hover:bg-red-600'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                <Check className="w-4 h-4" />
                Confirmar {type === 'ENTRADA' ? 'Entrada' : type === 'SAIDA' ? 'Saída' : 'Movimentação'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function currentProductStockText(prod: Product) {
  return `${prod.currentStock} ${prod.unit} (${prod.category})`;
}
