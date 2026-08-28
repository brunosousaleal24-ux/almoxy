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
import { useAuth } from '../context/AuthContext';
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
  const { products, employees, registerMovement } = useInventory();
  const { currentUser, userProfile } = useAuth();

  const [type, setType] = useState<MovementType>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState<MovementReason>('COMPRA_NF');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [requesterSector, setRequesterSector] = useState<string>('Produção / Campo');
  const [operatorName, setOperatorName] = useState<string>(
    userProfile?.displayName || currentUser?.displayName || 'Almoxarife'
  );
  const [employeeName, setEmployeeName] = useState<string>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial product and initial type when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentUser?.displayName || userProfile?.displayName) {
        setOperatorName(userProfile?.displayName || currentUser?.displayName || 'Almoxarife');
      }
      if (initialProduct) {
        setSelectedProductId(initialProduct.id);
        setProductSearch(initialProduct.name);
        setUnitCost(initialProduct.costPrice);
      } else if (products.length > 0) {
        setSelectedProductId(products[0].id);
        setProductSearch('');
        setUnitCost(products[0].costPrice);
      } else {
        setSelectedProductId('');
        setProductSearch('');
        setUnitCost('');
      }
      setType(initialType);
      setReason(initialType === 'ENTRADA' ? 'COMPRA_NF' : initialType === 'SAIDA' ? 'REQUISICAO_SETOR' : 'INVENTARIO_CORRECAO');
      setQuantity(1);
      setDocumentNumber('');
      setEmployeeName('');
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
      setRequesterSector('Produção / Campo');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProductId) {
      setErrorMessage('Por favor, selecione um item do almoxarifado.');
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setErrorMessage('A quantidade deve ser superior a zero.');
      return;
    }

    const numQty = Number(quantity);

    // Validate Stock Out
    if (type === 'SAIDA' && selectedProduct) {
      if (selectedProduct.currentStock < numQty) {
        setErrorMessage(
          `Saldo insuficiente. Disponível no momento: ${selectedProduct.currentStock} ${selectedProduct.unit}.`
        );
        return;
      }
    }

    const effectiveUnitCost =
      unitCost !== '' ? Number(unitCost) : selectedProduct ? selectedProduct.costPrice : 0;

    const res = registerMovement({
      productId: selectedProductId,
      type,
      quantity: numQty,
      unitCost: effectiveUnitCost,
      reason,
      documentNumber: documentNumber.trim() || undefined,
      requesterSector: requesterSector.trim() || undefined,
      operatorName: operatorName.trim() || 'Almoxarife',
      employeeName: employeeName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (res) {
      // Trigger celebration for successful movements
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#D4AF37', '#10B981', '#F59E0B'],
        });
      } catch (err) {
        // ignore in iframe
      }

      onClose();
    } else {
      setErrorMessage('Ocorreu um erro ao processar a movimentação no estoque.');
    }
  };

  // Filtered products for search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch)
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#16191E] border border-slate-200 dark:border-[#2C333E] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#262B33]">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl text-white ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-600'
                    : type === 'SAIDA'
                    ? 'bg-amber-600'
                    : 'bg-blue-600'
                }`}
              >
                {type === 'ENTRADA' ? (
                  <ArrowDownRight className="w-5 h-5" />
                ) : type === 'SAIDA' ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <Sliders className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-[#F9FAFB]">
                  {type === 'ENTRADA' && 'Lançar Entrada / Compra (NF)'}
                  {type === 'SAIDA' && 'Lançar Saída / Requisição de Obra'}
                  {type === 'AJUSTE' && 'Ajuste de Inventário / Correção'}
                  {type === 'TRANSFERENCIA' && 'Transferência de Galpão'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Atualização imediata de saldos contábeis e rastreabilidade por operador.
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

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-200 dark:border-[#262B33] bg-slate-50/50 dark:bg-[#111317] text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTypeChange('ENTRADA')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                type === 'ENTRADA'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#16191E]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Entrada</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('SAIDA')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                type === 'SAIDA'
                  ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-white dark:bg-[#16191E]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Saída</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('AJUSTE')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                type === 'AJUSTE'
                  ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-white dark:bg-[#16191E]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Ajuste</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('TRANSFERENCIA')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                type === 'TRANSFERENCIA'
                  ? 'border-purple-600 text-purple-700 dark:text-purple-400 bg-white dark:bg-[#16191E]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Transf.</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto font-sans text-xs">
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Product Selector */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Item do Almoxarifado *
              </label>

              {products.length === 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                  Nenhum produto cadastrado no momento. Cadastre itens no Catálogo primeiro para poder movimentar.
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Buscar por nome, código SKU ou código de barras..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />

                  {/* Quick Product Pick List */}
                  <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-[#2C333E] rounded-xl divide-y divide-slate-100 dark:divide-[#262B33] bg-white dark:bg-[#16191E]">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-center text-slate-400">Nenhum item encontrado</div>
                    ) : (
                      filteredProducts.map((p) => {
                        const isSelected = p.id === selectedProductId;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleProductSelect(p)}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                              isSelected
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                                : 'hover:bg-slate-50 dark:hover:bg-[#1F242C]'
                            }`}
                          >
                            <div>
                              <div className="font-serif font-bold text-slate-900 dark:text-white">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                SKU: {p.sku} | Local: {p.location.shelf}
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  p.currentStock === 0
                                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}
                              >
                                Saldo: {p.currentStock} {p.unit}
                              </span>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {formatCurrency(p.costPrice)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity and Unit Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantidade Movimentada *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  {selectedProduct && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">
                      {selectedProduct.unit}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custo Unitário (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) =>
                      setUnitCost(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Motivo & Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo da Movimentação
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as MovementReason)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="COMPRA_NF">Compra com Nota Fiscal</option>
                  <option value="REQUISICAO_SETOR">Requisição de Obra / Setor</option>
                  <option value="DEVOLUCAO_OBRA">Devolução de Material / Sobra</option>
                  <option value="INVENTARIO_CORRECAO">Ajuste de Inventário / Balanço</option>
                  <option value="PERDA_AVARIA">Avaria / Perda / Vencimento</option>
                  <option value="TRANSFERENCIA_LOCAL">Transferência entre Galpões</option>
                  <option value="OUTRO">Outro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nº da NF / Ordem de Serviço
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF-10492 ou OS-884"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Setor Requisitante & Colaborador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Setor Solicitante
                </label>
                <input
                  type="text"
                  placeholder="Ex: Elétrica / Hidráulica / Obra 01"
                  value={requesterSector}
                  onChange={(e) => setRequesterSector(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Colaborador / Retirado por
                </label>
                <input
                  type="text"
                  list="movement-employees-list"
                  placeholder="Nome ou matrícula do colaborador"
                  value={employeeName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmployeeName(val);
                    const matched = employees.find(
                      (emp) =>
                        emp.name.toLowerCase() === val.toLowerCase() ||
                        emp.registrationNumber.toLowerCase() === val.toLowerCase()
                    );
                    if (matched) {
                      setEmployeeName(matched.name);
                      if (matched.sector) setRequesterSector(matched.sector);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
                <datalist id="movement-employees-list">
                  {employees
                    .filter((emp) => emp.active)
                    .map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.registrationNumber} — {emp.role} ({emp.sector})
                      </option>
                    ))}
                </datalist>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações de Auditoria
              </label>
              <textarea
                rows={2}
                placeholder="Detalhes adicionais sobre a movimentação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E24] border border-slate-200 dark:border-[#2C333E] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
              />
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
                className={`px-5 py-2 text-white font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5 ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                    : type === 'SAIDA'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Lançamento</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
