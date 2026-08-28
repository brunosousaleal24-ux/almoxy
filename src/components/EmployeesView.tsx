import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Phone,
  Mail,
  Briefcase,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Shield,
  Layers,
  Wrench,
  Hash,
  UserCheck,
  UserX,
  CreditCard,
  Eye,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Employee } from '../types';

export const EmployeesView: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    deleteEmployeesBulk,
    clearAllEmployees,
    toolCautions,
    movements,
  } = useInventory();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [viewingEmployeeHistory, setViewingEmployeeHistory] = useState<Employee | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formRegistration, setFormRegistration] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formSector, setFormSector] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  // Extract unique sectors
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.sector) set.add(e.sector);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Common roles suggestions
  const commonRoles = [
    'Almoxarife Chefe',
    'Assistente de Almoxarifado',
    'Mestre de Obras',
    'Encarregado de Obras',
    'Engenheiro Civil',
    'Eletricista Predial',
    'Eletricista Força & Controle',
    'Encanador Industrial',
    'Encanador Predial',
    'Pedreiro Especialista',
    'Servente de Obras',
    'Pintor Industrial / Predial',
    'Soldador TIG / MIG',
    'Técnico em Segurança do Trabalho',
    'Operador de Máquinas',
    'Carpinteiro',
    'Gesseiro',
  ];

  // Common sectors suggestions
  const commonSectors = [
    'Almoxarifado',
    'Elétrica',
    'Hidráulica',
    'Obras & Construção Civil',
    'Engenharia',
    'Manutenção & Montagem',
    'Pintura & Acabamento',
    'Segurança do Trabalho',
    'Administrativo & Logística',
  ];

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.cpf && emp.cpf.includes(searchTerm)) ||
        (emp.phone && emp.phone.includes(searchTerm)) ||
        (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSector = selectedSector === 'ALL' || emp.sector === selectedSector;
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && emp.active) ||
        (selectedStatus === 'INACTIVE' && !emp.active);

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [employees, searchTerm, selectedSector, selectedStatus]);

  // Stats calculation
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.active).length;
  const inactiveCount = totalEmployees - activeCount;

  // Active open cautions for all employees
  const activeCautionsMap = useMemo(() => {
    const map = new Map<string, number>();
    toolCautions.forEach((c) => {
      if (c.status === 'EM_USO') {
        const key = c.employeeName.trim().toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [toolCautions]);

  // Open Form for Create
  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormCpf('');
    const nextNum = employees.length + 101;
    setFormRegistration(`MAT-${String(nextNum).padStart(4, '0')}`);
    setFormRole('');
    setFormSector('');
    setFormPhone('');
    setFormEmail('');
    setFormActive(true);
    setFormNotes('');
    setShowFormModal(true);
  };

  // Open Form for Edit
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormCpf(emp.cpf || '');
    setFormRegistration(emp.registrationNumber);
    setFormRole(emp.role);
    setFormSector(emp.sector);
    setFormPhone(emp.phone || '');
    setFormEmail(emp.email || '');
    setFormActive(emp.active);
    setFormNotes(emp.notes || '');
    setShowFormModal(true);
  };

  // Save Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        name: formName.trim(),
        cpf: formCpf.trim() || '000.000.000-00',
        registrationNumber: formRegistration.trim() || `MAT-${Date.now().toString().slice(-4)}`,
        role: formRole.trim() || 'Colaborador',
        sector: formSector.trim() || 'Geral',
        phone: formPhone.trim(),
        email: formEmail.trim(),
        active: formActive,
        notes: formNotes.trim(),
      });
    } else {
      addEmployee({
        name: formName.trim(),
        cpf: formCpf.trim() || '000.000.000-00',
        registrationNumber: formRegistration.trim() || `MAT-${Date.now().toString().slice(-4)}`,
        role: formRole.trim() || 'Colaborador',
        sector: formSector.trim() || 'Geral',
        phone: formPhone.trim(),
        email: formEmail.trim(),
        active: formActive,
        notes: formNotes.trim(),
      });
    }

    setShowFormModal(false);
  };

  // Delete Handlers
  const handleConfirmSingleDelete = () => {
    if (!employeeToDelete) return;
    deleteEmployee(employeeToDelete.id);
    setSelectedIds((prev) => prev.filter((id) => id !== employeeToDelete.id));
    setEmployeeToDelete(null);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    deleteEmployeesBulk(selectedIds);
    setSelectedIds([]);
    setShowBulkDeleteModal(false);
  };

  const handleConfirmClearAll = () => {
    clearAllEmployees();
    setSelectedIds([]);
    setShowClearAllModal(false);
  };

  // Select all toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map((e) => e.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Quick toggle active status
  const handleToggleActiveStatus = (emp: Employee) => {
    updateEmployee(emp.id, { active: !emp.active });
  };

  // Export CSV
  const handleExportCsv = () => {
    if (employees.length === 0) return;
    const headers = ['Matrícula', 'Nome Completo', 'Cargo', 'Setor', 'CPF', 'Telefone', 'E-mail', 'Status', 'Data Cadastro', 'Observações'];
    const rows = employees.map((e) => [
      `"${e.registrationNumber}"`,
      `"${e.name}"`,
      `"${e.role}"`,
      `"${e.sector}"`,
      `"${e.cpf || ''}"`,
      `"${e.phone || ''}"`,
      `"${e.email || ''}"`,
      `"${e.active ? 'Ativo' : 'Inativo'}"`,
      `"${new Date(e.createdAt).toLocaleDateString('pt-BR')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `funcionarios_borges_gomes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-14 font-sans text-[#E2E8F0]">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-black text-white flex items-center gap-2.5 tracking-wide">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-950/40 border border-amber-400/40">
              <Users className="w-5 h-5 text-slate-950" />
            </div>
            Gestão de Funcionários & Colaboradores
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Cadastro unificado da equipe de campo e almoxarifado. Controle de matrículas funcionais, cargos, setores operacionais e rastreabilidade de retiradas e cautelas de ferramentas.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              id="btn-bulk-delete-employees"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-red-950/70 hover:bg-red-900/80 text-red-300 border border-red-500/50 text-xs font-bold flex items-center gap-1.5 shadow-lg transition active:scale-95 cursor-pointer animate-fade-in"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Apagar Selecionados ({selectedIds.length})</span>
            </button>
          )}

          {employees.length > 0 && (
            <button
              id="btn-clear-all-employees"
              onClick={() => setShowClearAllModal(true)}
              className="px-3 py-2 rounded-xl bg-[#111827] hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Apagar todos os funcionários cadastrados"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
              <span className="hidden sm:inline">Limpar Todos</span>
            </button>
          )}

          <button
            id="btn-export-employees-csv"
            onClick={handleExportCsv}
            disabled={employees.length === 0}
            className="px-3.5 py-2 rounded-xl bg-[#131B2B] hover:bg-[#1A253A] text-slate-200 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
            title="Exportar listagem completa para CSV/Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            id="btn-new-employee"
            onClick={handleOpenCreateModal}
            className="brand-gradient-btn px-4 py-2 rounded-xl text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>Novo Funcionário</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Colaboradores */}
        <div className="p-4 rounded-2xl bg-[#0D1424] border border-amber-500/30 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Total de Funcionários</div>
            <div className="text-2xl font-serif font-black text-white mt-0.5">{totalEmployees}</div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">Cadastrados no sistema</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Ativos */}
        <div className="p-4 rounded-2xl bg-[#0D1424] border border-emerald-500/30 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-emerald-300/80 font-bold">Colaboradores Ativos</div>
            <div className="text-2xl font-serif font-black text-emerald-400 mt-0.5">{activeCount}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {totalEmployees > 0 ? `${((activeCount / totalEmployees) * 100).toFixed(0)}% da equipe operacional` : '0%'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Inativos */}
        <div className="p-4 rounded-2xl bg-[#0D1424] border border-slate-700/60 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Inativos / Bloqueados</div>
            <div className="text-2xl font-serif font-black text-slate-300 mt-0.5">{inactiveCount}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Sem permissão de retirada</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        {/* Setores */}
        <div className="p-4 rounded-2xl bg-[#0D1424] border border-indigo-500/30 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-indigo-300/80 font-bold">Setores Ativos</div>
            <div className="text-2xl font-serif font-black text-indigo-300 mt-0.5">{availableSectors.length}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Departamentos de campo</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters, Search & View Controls */}
      <div className="p-4 rounded-2xl bg-[#0D131F] border border-amber-500/25 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-employees"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nome, Matrícula, Cargo, CPF ou Telefone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#080C14] border border-slate-800 focus:border-amber-500/60 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status & View Mode */}
          <div className="flex items-center gap-2">
            {/* Status Select */}
            <select
              id="select-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-[#080C14] border border-slate-800 text-xs text-slate-200 outline-none focus:border-amber-500/60 cursor-pointer"
            >
              <option value="ALL">Status: Todos</option>
              <option value="ACTIVE">Apenas Ativos</option>
              <option value="INACTIVE">Apenas Inativos</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-[#080C14] border border-slate-800 rounded-xl">
              <button
                id="btn-view-table"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tabela
              </button>
              <button
                id="btn-view-cards"
                onClick={() => setViewMode('CARDS')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Crachás
              </button>
            </div>
          </div>
        </div>

        {/* Sector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" />
            Setor:
          </span>

          <button
            onClick={() => setSelectedSector('ALL')}
            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              selectedSector === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({employees.length})
          </button>

          {availableSectors.map((sector) => {
            const count = employees.filter((e) => e.sector === sector).length;
            return (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
                  selectedSector === sector
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold'
                    : 'bg-[#080C14] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sector} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0D131F] border border-amber-500/20 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">Nenhum funcionário encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchTerm || selectedSector !== 'ALL' || selectedStatus !== 'ALL'
              ? 'Tente alterar os termos da busca ou redefinir os filtros aplicados.'
              : 'Comece cadastrando o primeiro colaborador para autorizar retiradas de ferramentas e movimentações.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="brand-gradient-btn px-4 py-2 rounded-xl text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer mt-2"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>Cadastrar Primeiro Funcionário</span>
          </button>
        </div>
      ) : viewMode === 'TABLE' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-[#0D131F] border border-amber-500/30 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-amber-500/20 bg-[#090D17] text-slate-400 font-serif">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded accent-amber-500 cursor-pointer w-4 h-4"
                      title="Selecionar todos os colaboradores exibidos"
                    />
                  </th>
                  <th className="py-3 px-4 font-bold text-white tracking-wide">Colaborador / Matrícula</th>
                  <th className="py-3 px-4 font-bold text-white tracking-wide">Cargo & Função</th>
                  <th className="py-3 px-4 font-bold text-white tracking-wide">Setor / Departamento</th>
                  <th className="py-3 px-4 font-bold text-white tracking-wide">Contato & CPF</th>
                  <th className="py-3 px-4 font-bold text-white tracking-wide text-center">Cautelas em Aberto</th>
                  <th className="py-3 px-4 font-bold text-white tracking-wide text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-white tracking-wide text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedIds.includes(emp.id);
                  const openCautionsCount = activeCautionsMap.get(emp.name.trim().toLowerCase()) || 0;
                  const initials = emp.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-[#121B2C] transition-colors ${
                        isSelected ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(emp.id)}
                          className="rounded accent-amber-500 cursor-pointer w-4 h-4"
                        />
                      </td>

                      {/* Colaborador / Matrícula */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600/30 to-amber-500/10 border border-amber-500/40 text-amber-300 font-serif font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="font-serif font-bold text-sm text-white flex items-center gap-2">
                              {emp.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] bg-[#070A10] px-1.5 py-0.2 rounded border border-amber-500/30 text-amber-300 font-bold">
                                {emp.registrationNumber}
                              </span>
                              {emp.notes && (
                                <span
                                  className="text-[10px] text-slate-400 truncate max-w-[200px]"
                                  title={emp.notes}
                                >
                                  • {emp.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cargo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                          <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{emp.role}</span>
                        </div>
                      </td>

                      {/* Setor */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-md bg-[#080C14] border border-slate-700 text-slate-300 text-[11px] font-medium">
                          <Building className="w-3 h-3 text-indigo-400" />
                          {emp.sector}
                        </span>
                      </td>

                      {/* Contato & CPF */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          {emp.phone && (
                            <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{emp.phone}</span>
                            </div>
                          )}
                          {emp.email && (
                            <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[220px]">
                              <Mail className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate">{emp.email}</span>
                            </div>
                          )}
                          {emp.cpf && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              CPF: {emp.cpf}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cautelas Ativas */}
                      <td className="py-3 px-4 text-center">
                        {openCautionsCount > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[11px] font-bold font-mono"
                            title={`${openCautionsCount} ferramenta(s) em posse no momento`}
                          >
                            <Wrench className="w-3 h-3 text-amber-400" />
                            {openCautionsCount} em uso
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Nenhuma
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActiveStatus(emp)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                            emp.active
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/80'
                              : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800'
                          }`}
                          title="Clique para alternar o status Ativo/Inativo"
                        >
                          {emp.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-500" />
                              Inativo
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-employee-${emp.id}`}
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 rounded-lg bg-[#080C14] hover:bg-[#162032] text-amber-300 border border-slate-800 hover:border-amber-500/50 transition cursor-pointer"
                            title="Editar cadastro do funcionário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`btn-delete-employee-${emp.id}`}
                            onClick={() => setEmployeeToDelete(emp)}
                            className="p-1.5 rounded-lg bg-[#080C14] hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/50 transition cursor-pointer"
                            title="Excluir funcionário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 border-t border-amber-500/20 bg-[#090D17] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              Exibindo <strong>{filteredEmployees.length}</strong> de <strong>{employees.length}</strong> colaboradores
            </div>
            {selectedIds.length > 0 && (
              <div className="text-amber-300 font-semibold text-xs">
                {selectedIds.length} colaborador(es) selecionado(s)
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CARDS / BADGES VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const isSelected = selectedIds.includes(emp.id);
            const openCautionsCount = activeCautionsMap.get(emp.name.trim().toLowerCase()) || 0;
            const initials = emp.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={emp.id}
                className={`p-4 rounded-2xl bg-[#0D131F] border transition-all duration-200 relative overflow-hidden shadow-lg flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-[#121B2D] shadow-amber-950/30'
                    : 'border-amber-500/30 hover:border-amber-500/60'
                }`}
              >
                {/* Gold Ribbon / Top Strip */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-serif font-black text-sm flex items-center justify-center shrink-0 shadow-md border border-amber-400/40">
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-white text-base leading-tight">
                        {emp.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] bg-[#070A10] px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                          {emp.registrationNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            emp.active
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          {emp.active ? '● Ativo' : '○ Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelectOne(emp.id)}
                    className="rounded accent-amber-500 cursor-pointer w-4 h-4 mt-1"
                  />
                </div>

                {/* Details Body */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Cargo / Função:</span>
                    <span className="font-semibold text-slate-200">{emp.role}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Setor:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#080C14] border border-slate-700 text-indigo-300 font-medium text-[11px]">
                      <Building className="w-3 h-3" />
                      {emp.sector}
                    </span>
                  </div>

                  {emp.cpf && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">CPF:</span>
                      <span className="font-mono text-slate-300">{emp.cpf}</span>
                    </div>
                  )}

                  {emp.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Telefone:</span>
                      <span className="font-mono text-emerald-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {emp.phone}
                      </span>
                    </div>
                  )}

                  {emp.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">E-mail:</span>
                      <span className="text-blue-300 truncate max-w-[180px]">{emp.email}</span>
                    </div>
                  )}

                  {/* Cautelas Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Cautelas em Aberto:</span>
                    {openCautionsCount > 0 ? (
                      <span className="font-mono text-amber-300 font-bold bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded text-[11px]">
                        {openCautionsCount} item(ns)
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Nenhuma</span>
                    )}
                  </div>

                  {emp.notes && (
                    <p className="text-[11px] text-slate-400 bg-[#080C14] p-2 rounded-lg border border-slate-800 line-clamp-2">
                      {emp.notes}
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActiveStatus(emp)}
                    className="text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {emp.active ? 'Desativar' : 'Ativar'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(emp)}
                      className="px-2.5 py-1 rounded-lg bg-[#080C14] hover:bg-[#162032] text-amber-300 border border-slate-800 hover:border-amber-500/50 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => setEmployeeToDelete(emp)}
                      className="px-2.5 py-1 rounded-lg bg-[#080C14] hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/50 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Apagar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO DE FUNCIONÁRIO */}
      {/* ========================================================================= */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-[#0D131F] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-black text-white">
                    {editingEmployee ? 'Editar Cadastro de Funcionário' : 'Novo Funcionário / Colaborador'}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    {editingEmployee
                      ? 'Atualize os dados cadastrais e permissões do colaborador.'
                      : 'Preencha os dados para registrar o colaborador no almoxarifado.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* Nome Completo */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nome Completo do Funcionário <span className="text-amber-400">*</span>
                </label>
                <input
                  id="form-emp-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Carlos Borges da Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 focus:border-amber-500 text-white text-xs outline-none transition"
                />
              </div>

              {/* Matrícula & CPF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Matrícula / Registro Funcional <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="form-emp-reg"
                      type="text"
                      required
                      value={formRegistration}
                      onChange={(e) => setFormRegistration(e.target.value)}
                      placeholder="Ex: MAT-0107"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 focus:border-amber-500 text-amber-300 font-mono text-xs outline-none transition font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomMat = `MAT-${Math.floor(1000 + Math.random() * 9000)}`;
                        setFormRegistration(randomMat);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.8 bg-[#131B2A] hover:bg-[#1E293B] text-slate-300 rounded text-[10px] font-mono border border-slate-700 transition"
                      title="Gerar código aleatório"
                    >
                      Gerar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">CPF</label>
                  <input
                    id="form-emp-cpf"
                    type="text"
                    value={formCpf}
                    onChange={(e) => setFormCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 focus:border-amber-500 text-white text-xs outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Cargo & Setor com Autocomplete/Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Cargo / Função <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="form-emp-role"
                    type="text"
                    required
                    list="roles-list"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Ex: Eletricista Predial"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 focus:border-amber-500 text-white text-xs outline-none transition"
                  />
                  <datalist id="roles-list">
                    {commonRoles.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Setor / Departamento <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="form-emp-sector"
                    type="text"
                    required
                    list="sectors-list"
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    placeholder="Ex: Elétrica"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 focus:border-amber-500 text-white text-xs outline-none transition"
                  />
                  <datalist id="sectors-list">
                    {commonSectors.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Telefone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Telefone / WhatsApp</label>
                  <input
                    id="form-emp-phone"
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 focus:border-amber-500 text-white text-xs outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">E-mail</label>
                  <input
                    id="form-emp-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="colaborador@borgesgomes.com.br"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 focus:border-amber-500 text-white text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Status Ativo Checkbox */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#080C14] border border-slate-800">
                <input
                  id="form-emp-active"
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded accent-amber-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="form-emp-active" className="text-slate-200 font-semibold cursor-pointer">
                  Colaborador Ativo (Permitir retiradas no estoque e cautelas de ferramentas)
                </label>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Observações & Certificações</label>
                <textarea
                  id="form-emp-notes"
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Certificado NR-10 e NR-35 válidos até 12/2026. Apto para trabalho em altura."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#080C14] border border-slate-700 focus:border-amber-500 text-white text-xs outline-none transition resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#121824] hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  id="btn-save-employee"
                  type="submit"
                  className="brand-gradient-btn px-5 py-2 rounded-xl text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition active:scale-95 cursor-pointer"
                >
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXCLUSÃO INDIVIDUAL COM CONFIRMAÇÃO */}
      {/* ========================================================================= */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0D131F] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-black text-white">Excluir Funcionário?</h3>
                <p className="text-xs text-slate-400 font-sans">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080C14] border border-slate-800 space-y-1 text-xs">
              <div className="font-serif font-bold text-white text-sm">{employeeToDelete.name}</div>
              <div className="text-slate-400">
                Matrícula: <span className="text-amber-300 font-mono font-bold">{employeeToDelete.registrationNumber}</span>
              </div>
              <div className="text-slate-400">Cargo: {employeeToDelete.role} ({employeeToDelete.sector})</div>

              {(activeCautionsMap.get(employeeToDelete.name.trim().toLowerCase()) || 0) > 0 && (
                <div className="mt-2 p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Atenção: Este funcionário possui cautelas de ferramentas em aberto no momento.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#121824] hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-employee"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-950/50 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXCLUSÃO EM LOTE (BULK DELETE) */}
      {/* ========================================================================= */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0D131F] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-black text-white">
                  Apagar {selectedIds.length} Funcionários Selecionados?
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Os colaboradores selecionados serão removidos permanentemente.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800 text-xs text-slate-300">
              Deseja realmente excluir todos os <strong>{selectedIds.length}</strong> funcionários marcados?
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-[#121824] hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-bulk-delete-employees"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-950/50 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Apagar Selecionados</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIMPAR TODOS OS FUNCIONÁRIOS */}
      {/* ========================================================================= */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0D131F] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-black text-white">Limpar Todo o Cadastro?</h3>
                <p className="text-xs text-slate-400 font-sans">
                  Todos os {employees.length} colaboradores cadastrados serão apagados.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300">
              Esta ação removerá todos os funcionários do banco de dados local e do Firebase Firestore.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl bg-[#121824] hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-clear-all-employees"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-950/50 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Limpar Todo o Cadastro</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
