import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Package,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ConstructionSite } from '../types';

export const ConstructionSitesView: React.FC = () => {
  const {
    constructionSites,
    movements,
    toolCautions,
    addConstructionSite,
    updateConstructionSite,
    deleteConstructionSite,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PLANEJAMENTO' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'SUSPENSA'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<ConstructionSite | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [manager, setManager] = useState('');
  const [status, setStatus] = useState<'PLANEJAMENTO' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'SUSPENSA'>('EM_ANDAMENTO');
  const [budgetTotal, setBudgetTotal] = useState(100000);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expectedEndDate, setExpectedEndDate] = useState('');

  // Calculate live site consumption from stock movements
  const siteAnalytics = useMemo(() => {
    return constructionSites.map((site) => {
      const siteMovements = movements.filter(
        (m) =>
          m.type === 'SAIDA' &&
          (m.requesterSector?.toLowerCase().includes(site.name.toLowerCase()) ||
            m.requesterSector?.toLowerCase().includes(site.code.toLowerCase()) ||
            m.notes?.toLowerCase().includes(site.name.toLowerCase()) ||
            m.notes?.toLowerCase().includes(site.code.toLowerCase()))
      );

      const computedConsumed = siteMovements.reduce(
        (acc, m) => acc + (m.totalCost || m.quantity * m.unitCost),
        0
      );

      const actualConsumed = Math.max(site.consumedValue || 0, computedConsumed);
      const budgetPct = site.budgetTotal > 0 ? (actualConsumed / site.budgetTotal) * 100 : 0;

      const activeTools = toolCautions.filter(
        (c) => c.constructionSiteId === site.id && c.status === 'EM_USO'
      ).length;

      return {
        ...site,
        actualConsumed,
        budgetPct: Math.min(budgetPct, 100),
        rawBudgetPct: budgetPct,
        activeTools,
        movementsCount: siteMovements.length,
      };
    });
  }, [constructionSites, movements, toolCautions]);

  const filteredSites = useMemo(() => {
    return siteAnalytics.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [siteAnalytics, searchTerm, statusFilter]);

  const totalBudget = constructionSites.reduce((acc, s) => acc + s.budgetTotal, 0);
  const totalConsumed = siteAnalytics.reduce((acc, s) => acc + s.actualConsumed, 0);
  const activeSitesCount = constructionSites.filter((s) => s.status === 'EM_ANDAMENTO').length;

  const openNewSiteModal = () => {
    setEditingSite(null);
    setName('');
    setCode(`OBR-00${constructionSites.length + 1}`);
    setAddress('');
    setManager('Eng. Roberto Albuquerque');
    setStatus('EM_ANDAMENTO');
    setBudgetTotal(250000);
    setStartDate(new Date().toISOString().slice(0, 10));
    setExpectedEndDate('');
    setIsModalOpen(true);
  };

  const openEditSiteModal = (site: ConstructionSite) => {
    setEditingSite(site);
    setName(site.name);
    setCode(site.code);
    setAddress(site.address);
    setManager(site.manager);
    setStatus(site.status);
    setBudgetTotal(site.budgetTotal);
    setStartDate(site.startDate || new Date().toISOString().slice(0, 10));
    setExpectedEndDate(site.expectedEndDate || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    if (editingSite) {
      updateConstructionSite(editingSite.id, {
        name,
        code,
        address,
        manager,
        status,
        budgetTotal: Number(budgetTotal),
        startDate,
        expectedEndDate,
      });
    } else {
      addConstructionSite({
        name,
        code,
        address,
        manager,
        status,
        budgetTotal: Number(budgetTotal),
        consumedValue: 0,
        startDate,
        expectedEndDate,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, siteName: string) => {
    if (confirm(`Tem certeza que deseja excluir a obra "${siteName}"?`)) {
      deleteConstructionSite(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="editorial-card-elevated rounded-2xl p-6 relative overflow-hidden bg-gradient-to-r from-[#0E1726] via-[#141E30] to-[#0E1726] text-white border border-amber-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="brand-badge-gold">BORGES & GOMES ENGENHARIA</span>
              <span className="text-[10px] text-slate-300 font-mono">CENTROS DE CUSTO & CANTEIROS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-amber-500" />
              Gestão de Canteiros de Obras
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Controle físico-financeiro de suprimentos alocados a cada projeto de engenharia, limites de orçamentos e alocação de ferramentas.
            </p>
          </div>

          <button
            id="btn-new-construction-site"
            onClick={openNewSiteModal}
            className="brand-gradient-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-900/30 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Nova Obra
          </button>
        </div>

        {/* Financial KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-700/60">
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Obras em Andamento</span>
            <div className="text-xl font-serif font-black text-amber-400 mt-0.5">{activeSitesCount}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Orçamento Total Geral</span>
            <div className="text-xl font-serif font-black text-white mt-0.5">
              R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Insumos Consumidos</span>
            <div className="text-xl font-serif font-black text-emerald-400 mt-0.5">
              R$ {totalConsumed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Saldo Disponível</span>
            <div className="text-xl font-serif font-black text-amber-300 mt-0.5">
              R$ {Math.max(0, totalBudget - totalConsumed).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="editorial-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome da obra, código, responsável ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="editorial-input w-full pl-9 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="editorial-input px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121620] cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="PLANEJAMENTO">Planejamento</option>
            <option value="CONCLUIDA">Concluídas</option>
            <option value="SUSPENSA">Suspensas</option>
          </select>
        </div>
      </div>

      {/* Construction Sites Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSites.map((site) => {
          const isOverBudget = site.rawBudgetPct > 100;

          return (
            <div
              key={site.id}
              className="editorial-card rounded-2xl p-5 hover:border-amber-500/40 transition duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {site.code}
                      </span>
                      {site.status === 'EM_ANDAMENTO' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          EM ANDAMENTO
                        </span>
                      )}
                      {site.status === 'PLANEJAMENTO' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                          PLANEJAMENTO
                        </span>
                      )}
                      {site.status === 'CONCLUIDA' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          CONCLUÍDA
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white mt-1.5 leading-snug">
                      {site.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditSiteModal(site)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(site.id, site.name)}
                      className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{site.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Responsável: <strong>{site.manager}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Início: {new Date(site.startDate).toLocaleDateString('pt-BR')}</span>
                    {site.expectedEndDate && (
                      <span>• Prev. Término: {new Date(site.expectedEndDate).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>

                {/* Budget Progress Bar */}
                <div className="bg-slate-50 dark:bg-[#151D2A] p-3 rounded-xl mb-3 border border-slate-100 dark:border-[#222D3E]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Consumo de Orçamento
                    </span>
                    <span className={`font-mono font-bold ${isOverBudget ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {site.rawBudgetPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverBudget
                          ? 'bg-red-500'
                          : site.rawBudgetPct > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${site.budgetPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2">
                    <div>
                      Consumido: <strong className="text-slate-800 dark:text-slate-200">R$ {site.actualConsumed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div>
                      Limite: <strong className="text-slate-800 dark:text-slate-200">R$ {site.budgetTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Badges */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1F293B] text-xs">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-amber-500" />
                    <strong>{site.activeTools}</strong> ferramentas em uso
                  </span>
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                  Centro Ativo
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Cadastro/Edição de Obra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="editorial-card rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222D3E]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                  {editingSite ? 'Editar Canteiro de Obra' : 'Cadastrar Nova Obra'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nome do Empreendimento / Obra <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Edifício Skyline Tower"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="editorial-input w-full p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Código <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="OBR-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="editorial-input w-full p-2.5 rounded-xl uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Endereço do Canteiro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Paulista, 1820 - São Paulo, SP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="editorial-input w-full p-2.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Engenheiro Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Eng. Roberto Albuquerque"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="editorial-input w-full p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Status da Obra
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="editorial-input w-full p-2.5 rounded-xl bg-white dark:bg-[#121620]"
                  >
                    <option value="PLANEJAMENTO">Planejamento</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="SUSPENSA">Suspensa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Orçamento Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={budgetTotal}
                    onChange={(e) => setBudgetTotal(Number(e.target.value))}
                    className="editorial-input w-full p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="editorial-input w-full p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Previsão de Conclusão
                  </label>
                  <input
                    type="date"
                    value={expectedEndDate}
                    onChange={(e) => setExpectedEndDate(e.target.value)}
                    className="editorial-input w-full p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#222D3E]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="brand-gradient-btn px-5 py-2 rounded-xl font-bold text-white shadow-md cursor-pointer"
                >
                  {editingSite ? 'Salvar Alterações' : 'Cadastrar Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
