import React, { useState } from 'react';
import {
  Truck,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Plus,
  Mail,
  Phone,
  Clock,
  Star,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatDate } from '../utils/exportUtils';
import { Supplier } from '../types';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    supplierQuotes,
    fetchExternalSupplierQuotes,
    applySupplierPriceUpdate,
    applyAllSupplierPriceUpdates,
    isSyncing,
    addSupplier,
  } = useInventory();

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupTrade, setNewSupTrade] = useState('');
  const [newSupCnpj, setNewSupCnpj] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupLeadTime, setNewSupLeadTime] = useState(3);
  const [apiCheckedOnce, setApiCheckedOnce] = useState(false);

  const handleFetchQuotes = async () => {
    await fetchExternalSupplierQuotes();
    setApiCheckedOnce(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    addSupplier({
      name: newSupName.trim(),
      tradeName: newSupTrade.trim() || newSupName.trim(),
      cnpj: newSupCnpj.trim() || '00.000.000/0001-00',
      contactEmail: newSupEmail.trim() || 'contato@fornecedor.com.br',
      phone: newSupPhone.trim() || '(11) 9999-8888',
      leadTimeDays: Number(newSupLeadTime),
      rating: 4.8,
      apiEndpoint: `https://api.${newSupName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br/v1/feed`,
      active: true,
    });

    setShowAddSupplierModal(false);
    setNewSupName('');
    setNewSupTrade('');
    setNewSupCnpj('');
    setNewSupEmail('');
    setNewSupPhone('');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-amber-500" />
            Integração com Fornecedores & Atualização de Preços
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Conexão com APIs externas de distribuidores para cotação em tempo real e reajuste automático de custos contábeis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Check Price APIs Button */}
          <button
            id="btn-fetch-supplier-quotes"
            onClick={handleFetchQuotes}
            disabled={isSyncing}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Consultando APIs...' : 'Consultar APIs de Preços'}</span>
          </button>

          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="px-3.5 py-2 bg-slate-900 dark:bg-[#1C2128] hover:bg-slate-800 dark:hover:bg-[#252C36] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 dark:border-[#2D3540] shadow-sm transition"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            <span>Cadastrar Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Supplier Live Price Quotes Feed (When fetched) */}
      {supplierQuotes.length > 0 && (
        <div className="p-5 bg-[#121519] text-white rounded-2xl border border-[#2B323D] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                API Feed Atualizado em Tempo Real
              </span>
              <h3 className="font-serif text-lg font-bold mt-1 text-[#F9FAFB]">
                Cotações Externas Recebidas ({supplierQuotes.length} produtos cotados)
              </h3>
            </div>

            <button
              onClick={applyAllSupplierPriceUpdates}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Aplicar Todos os Novos Preços no Sistema
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#262B33] text-[10px] font-serif font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Material / SKU</th>
                  <th className="py-2.5 px-3">Fornecedor</th>
                  <th className="py-2.5 px-3 text-right">Custo Atual</th>
                  <th className="py-2.5 px-3 text-right">Novo Preço Cotado</th>
                  <th className="py-2.5 px-3 text-center">Variação %</th>
                  <th className="py-2.5 px-3 text-center">Prazo Entrega</th>
                  <th className="py-2.5 px-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222831]">
                {supplierQuotes.map((quote) => {
                  const isCheaper = quote.priceChangePercent < 0;
                  return (
                    <tr key={quote.productId} className="hover:bg-[#1A1F26] transition">
                      <td className="py-2.5 px-3 font-medium text-white">
                        {quote.productName}
                        <span className="block font-mono text-[10px] text-amber-400">
                          {quote.productSku}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{quote.supplierName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {formatCurrency(quote.currentSystemCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                        {formatCurrency(quote.newQuotedPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono ${
                            isCheaper ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {isCheaper ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          {quote.priceChangePercent > 0 ? `+${quote.priceChangePercent}%` : `${quote.priceChangePercent}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300 font-mono">
                        {quote.leadTimeDays} dias
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => applySupplierPriceUpdate(quote.productId, quote.newQuotedPrice)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition"
                        >
                          Atualizar Custo
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((sup) => (
          <div
            key={sup.id}
            className="p-5 bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33] rounded-2xl shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-serif font-bold text-base text-slate-900 dark:text-[#F9FAFB] block">
                  {sup.tradeName || sup.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  CNPJ: {sup.cnpj}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-[#1E1C15] text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-full text-xs font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{sup.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-[#262B33]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{sup.contactEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{sup.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Prazo Médio de Entrega: <strong className="text-slate-900 dark:text-white font-mono">{sup.leadTimeDays} dias úteis</strong></span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-[#262B33]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="w-3 h-3" /> API Homologada
              </span>
              <span className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                {sup.apiEndpoint}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#2C333E] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-[#F9FAFB]">
              Cadastrar Novo Fornecedor Homologado
            </h3>

            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Razão Social / Nome *</label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder="Ex: Comercial Gomes & Filhos S/A"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nome Fantasia</label>
                <input
                  type="text"
                  value={newSupTrade}
                  onChange={(e) => setNewSupTrade(e.target.value)}
                  placeholder="Ex: Gomes Distribuidora"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">CNPJ</label>
                  <input
                    type="text"
                    value={newSupCnpj}
                    onChange={(e) => setNewSupCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3.5 py-2 font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Prazo Lead Time (Dias)</label>
                  <input
                    type="number"
                    min="1"
                    value={newSupLeadTime}
                    onChange={(e) => setNewSupLeadTime(Number(e.target.value))}
                    className="w-full px-3.5 py-2 font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">E-mail Comercial</label>
                  <input
                    type="email"
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    placeholder="pedidos@empresa.com"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#262B33]">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md transition active:scale-95"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
