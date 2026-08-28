import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  UserCheck,
  Building2,
  Wrench,
  FileSpreadsheet,
  FileText,
  Calendar,
  RotateCcw,
  Tag,
  Hammer,
  Trash2,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ToolCaution, Product } from '../types';

export const CautelasView: React.FC = () => {
  const {
    products,
    toolCautions,
    employees,
    constructionSites,
    checkoutToolCaution,
    returnToolCaution,
    deleteCaution,
    clearFinishedCautions,
    clearAllCautions,
  } = useInventory();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EM_USO' | 'DEVOLVIDA' | 'ATRASADA' | 'AVARIADA'>('ALL');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [cautionToDelete, setCautionToDelete] = useState<ToolCaution | null>(null);

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeRole, setEmployeeRole] = useState('Pedreiro');
  const [employeeSector, setEmployeeSector] = useState('Construção Civil & Alvenaria');
  const [selectedSiteId, setSelectedSiteId] = useState(constructionSites[0]?.id || '');
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [conditionOnCheckout, setConditionOnCheckout] = useState<'NOVO' | 'BOM' | 'REGULAR'>('BOM');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [operatorCheckout, setOperatorCheckout] = useState('Carlos Borges (Almoxarife)');

  // Return Modal State
  const [returningCaution, setReturningCaution] = useState<ToolCaution | null>(null);
  const [conditionOnReturn, setConditionOnReturn] = useState<'BOM' | 'REGULAR' | 'AVARIADO' | 'PERDIDO'>('BOM');
  const [returnNotes, setReturnNotes] = useState('');
  const [operatorReturn, setOperatorReturn] = useState('Carlos Borges (Almoxarife)');

  // Filter tools available in catalog
  const toolProducts = useMemo(() => {
    return products.filter((p) => p.category === 'Ferramentas' || p.category === 'Peças & Mecânica');
  }, [products]);

  // Filtered Cautions List
  const filteredCautions = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    return toolCautions
      .map((c) => {
        // Compute dynamic overdue status
        if (c.status === 'EM_USO' && c.expectedReturnDate < todayStr) {
          return { ...c, isOverdue: true };
        }
        return { ...c, isOverdue: false };
      })
      .filter((c) => {
        const matchesSearch =
          c.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.toolSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.constructionSiteName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'ALL'
            ? true
            : statusFilter === 'ATRASADA'
            ? c.isOverdue && c.status === 'EM_USO'
            : c.status === statusFilter;

        const matchesSite = siteFilter === 'ALL' || c.constructionSiteId === siteFilter;

        return matchesSearch && matchesStatus && matchesSite;
      });
  }, [toolCautions, searchTerm, statusFilter, siteFilter]);

  // Summary Metrics
  const activeCautionsCount = toolCautions.filter((c) => c.status === 'EM_USO').length;
  const returnedCautionsCount = toolCautions.filter((c) => c.status === 'DEVOLVIDA').length;
  const overdueCount = toolCautions.filter(
    (c) => c.status === 'EM_USO' && c.expectedReturnDate < new Date().toISOString().slice(0, 10)
  ).length;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolId) {
      alert('Selecione uma ferramenta para a cautela.');
      return;
    }
    if (!employeeName.trim()) {
      alert('Informe o nome do colaborador solicitante.');
      return;
    }

    const res = checkoutToolCaution({
      toolId: selectedToolId,
      employeeName,
      employeeRole,
      employeeSector,
      constructionSiteId: selectedSiteId,
      expectedReturnDate,
      conditionOnCheckout,
      operatorCheckout,
      notes: checkoutNotes,
    });

    if (res.success) {
      setIsCheckoutModalOpen(false);
      setSelectedToolId('');
      setEmployeeName('');
      setCheckoutNotes('');
    } else {
      alert(res.error || 'Erro ao emitir cautela.');
    }
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningCaution) return;

    const res = returnToolCaution(returningCaution.id, conditionOnReturn, operatorReturn, returnNotes);
    if (res.success) {
      setReturningCaution(null);
      setReturnNotes('');
    } else {
      alert(res.error || 'Erro ao registrar devolução.');
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
              <span className="text-[10px] text-slate-300 font-mono">CONTROLE PATRIMONIAL DE FERRAMENTAS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-amber-500" />
              Gestão de Cautelas & Empréstimos
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Rastreamento rigoroso de máquinas e ferramentas alocadas aos canteiros de obras e colaboradores, com controle de devolução e estado de conservação.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {toolCautions.some((c) => c.status !== 'EM_USO') && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Deseja limpar todas as cautelas já devolvidas / encerradas do histórico?')) {
                    clearFinishedCautions();
                  }
                }}
                className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 transition cursor-pointer"
                title="Limpar apenas as cautelas já devolvidas"
              >
                Limpar Devolvidas
              </button>
            )}

            {toolCautions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja apagar todas as cautelas registradas?')) {
                    clearAllCautions();
                  }
                }}
                className="p-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-xl transition cursor-pointer"
                title="Apagar todas as cautelas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              id="btn-new-caution"
              onClick={() => setIsCheckoutModalOpen(true)}
              className="brand-gradient-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-900/30 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nova Cautela / Empréstimo
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-700/60">
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Cautelas Ativas</span>
            <div className="text-xl font-serif font-black text-amber-400 mt-0.5">{activeCautionsCount}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Atrasadas / Alerta</span>
            <div className="text-xl font-serif font-black text-red-400 mt-0.5">{overdueCount}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Devoluções Concluídas</span>
            <div className="text-xl font-serif font-black text-emerald-400 mt-0.5">{returnedCautionsCount}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Total Registrado</span>
            <div className="text-xl font-serif font-black text-white mt-0.5">{toolCautions.length}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="editorial-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ferramenta, SKU, colaborador ou obra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="editorial-input w-full pl-9 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="editorial-input px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121620] cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="EM_USO">Em Uso (Ativas)</option>
            <option value="ATRASADA">Atrasadas</option>
            <option value="DEVOLVIDA">Devolvidas</option>
            <option value="AVARIADA">Avariadas / Perdidas</option>
          </select>

          {/* Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="editorial-input px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121620] cursor-pointer"
          >
            <option value="ALL">Todas as Obras / Canteiros</option>
            {constructionSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cautions List / Table */}
      <div className="editorial-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#151D2A] border-b border-slate-200 dark:border-[#222D3E] text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">Ferramenta / SKU</th>
                <th className="py-3 px-4 font-bold">Colaborador</th>
                <th className="py-3 px-4 font-bold">Obra / Canteiro</th>
                <th className="py-3 px-4 font-bold">Retirada</th>
                <th className="py-3 px-4 font-bold">Prev. Devolução</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1F293B]">
              {filteredCautions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Wrench className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-medium text-sm">Nenhuma cautela de ferramenta encontrada.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Clique no botão "Nova Cautela" acima para registrar um empréstimo para uma obra.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCautions.map((c) => {
                  const isOverdue = (c as any).isOverdue;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-[#151D2A]/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-amber-500" />
                          <span>{c.toolName}</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">SKU: {c.toolSku}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{c.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{c.employeeRole} • {c.employeeSector}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{c.constructionSiteName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {new Date(c.checkoutDate).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-bold flex items-center gap-1' : 'text-slate-600 dark:text-slate-400'}>
                          {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          {new Date(c.expectedReturnDate).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {c.status === 'EM_USO' && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              isOverdue
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {isOverdue ? 'ATRASADA' : 'EM USO'}
                          </span>
                        )}
                        {c.status === 'DEVOLVIDA' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            DEVOLVIDA
                          </span>
                        )}
                        {c.status === 'AVARIADA' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            AVARIADA / PERDIDA
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === 'EM_USO' ? (
                            <button
                              id={`btn-return-caution-${c.id}`}
                              onClick={() => setReturningCaution(c)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Devolver
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {c.returnedDate ? `Em ${new Date(c.returnedDate).toLocaleDateString('pt-BR')}` : '-'}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setCautionToDelete(c)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            title="Apagar cautela"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Modal Nova Cautela */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="editorial-card rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222D3E]">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                  Emitir Nova Cautela de Ferramenta
                </h3>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 text-xs">
              {/* Select Tool */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Ferramenta / Equipamento <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedToolId}
                  onChange={(e) => setSelectedToolId(e.target.value)}
                  required
                  className="editorial-input w-full p-2.5 rounded-xl bg-white dark:bg-[#121620]"
                >
                  <option value="">Selecione uma ferramenta...</option>
                  {toolProducts.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.currentStock < 1}>
                      {t.name} (SKU: {t.sku}) — Saldo Atual: {t.currentStock} {t.unit} {t.currentStock < 1 ? '[SEM ESTOQUE]' : ''}
                    </option>
                  ))}
                </select>
                {toolProducts.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Nenhuma ferramenta cadastrada na categoria "Ferramentas". Cadastre produtos nessa categoria no Estoque.
                  </p>
                )}
              </div>

              {/* Colaborador & Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Colaborador Responsável <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="registered-employees-list"
                    placeholder="Ex: João da Silva ou escolha na lista"
                    value={employeeName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmployeeName(val);
                      const matched = employees.find(
                        (emp) => emp.name.toLowerCase() === val.toLowerCase() || emp.registrationNumber.toLowerCase() === val.toLowerCase()
                      );
                      if (matched) {
                        setEmployeeName(matched.name);
                        setEmployeeRole(matched.role);
                        setEmployeeSector(matched.sector);
                      }
                    }}
                    className="editorial-input w-full p-2.5 rounded-xl"
                  />
                  <datalist id="registered-employees-list">
                    {employees.filter((emp) => emp.active).map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.registrationNumber} — {emp.role} ({emp.sector})
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Função / Cargo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Eletricista, Encanador"
                    value={employeeRole}
                    onChange={(e) => setEmployeeRole(e.target.value)}
                    className="editorial-input w-full p-2.5 rounded-xl"
                  />
                </div>
              </div>

              {/* Obra de Destino */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Obra / Canteiro de Destino <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  required
                  className="editorial-input w-full p-2.5 rounded-xl bg-white dark:bg-[#121620]"
                >
                  {constructionSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.code}) — {site.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data de Devolução & Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Previsão de Devolução <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="editorial-input w-full p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Estado de Conservação
                  </label>
                  <select
                    value={conditionOnCheckout}
                    onChange={(e) => setConditionOnCheckout(e.target.value as any)}
                    className="editorial-input w-full p-2.5 rounded-xl bg-white dark:bg-[#121620]"
                  >
                    <option value="NOVO">Novo / Impecável</option>
                    <option value="BOM">Bom Estado de Uso</option>
                    <option value="REGULAR">Regular com marcas de uso</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Observações / Acessórios Entregues
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Acompanha maleta, 2 baterias 18V e carregador bivolt..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="editorial-input w-full p-2.5 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#222D3E]">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="brand-gradient-btn px-5 py-2 rounded-xl font-bold text-white shadow-md cursor-pointer"
                >
                  Confirmar Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Devolução de Cautela */}
      {returningCaution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="editorial-card rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222D3E]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-500" />
                <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                  Registrar Devolução de Cautela
                </h3>
              </div>
              <button
                onClick={() => setReturningCaution(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-[#151D2A] p-3 rounded-xl space-y-1 text-xs">
              <div className="font-semibold text-slate-900 dark:text-white">{returningCaution.toolName}</div>
              <div className="text-slate-500 dark:text-slate-400">
                Colaborador: <strong>{returningCaution.employeeName}</strong> • Obra: {returningCaution.constructionSiteName}
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Condição Física na Devolução <span className="text-red-500">*</span>
                </label>
                <select
                  value={conditionOnReturn}
                  onChange={(e) => setConditionOnReturn(e.target.value as any)}
                  className="editorial-input w-full p-2.5 rounded-xl bg-white dark:bg-[#121620]"
                >
                  <option value="BOM">Bom Estado (Retorna ao estoque)</option>
                  <option value="REGULAR">Regular (Retorna ao estoque)</option>
                  <option value="AVARIADO">Avariado / Quebrado (Envia para manutenção)</option>
                  <option value="PERDIDO">Perdido / Extraviado (Baixa patrimonial)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Almoxarife Responsável pelo Recebimento
                </label>
                <input
                  type="text"
                  value={operatorReturn}
                  onChange={(e) => setOperatorReturn(e.target.value)}
                  className="editorial-input w-full p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Observações da Devolução
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Devolvido limpo, sem avarias e com todos os acessórios originais..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="editorial-input w-full p-2.5 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#222D3E]">
                <button
                  type="button"
                  onClick={() => setReturningCaution(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition cursor-pointer"
                >
                  Confirmar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Caution Confirmation Modal */}
      {cautionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#16191D] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                Apagar Cautela
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tem certeza que deseja apagar o registro da cautela de <strong>{cautionToDelete.toolName}</strong> para <strong>{cautionToDelete.employeeName}</strong>?
            </p>

            {cautionToDelete.status === 'EM_USO' && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                ℹ️ Como a ferramenta estava em uso, a unidade será estornada de volta ao saldo disponível em estoque.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCautionToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-[#1C2128] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-[#252C36] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCaution(cautionToDelete.id, true);
                  setCautionToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Apagar Cautela</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
