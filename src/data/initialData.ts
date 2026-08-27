import { Product, StockMovement, Supplier, AppSettings, ConstructionSite, ToolCaution } from '../types';

// Zerado para início de operação do almoxarifado
export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_MOVEMENTS: StockMovement[] = [];

export const INITIAL_CONSTRUCTION_SITES: ConstructionSite[] = [
  {
    id: 'obra-skyline',
    name: 'Edifício Residencial Skyline Tower',
    code: 'OBR-001',
    address: 'Av. Paulista, 1820 - Bela Vista, SP',
    manager: 'Eng. Roberto Albuquerque',
    status: 'EM_ANDAMENTO',
    budgetTotal: 450000.0,
    consumedValue: 128450.0,
    startDate: '2026-01-15',
    expectedEndDate: '2027-06-30',
  },
  {
    id: 'obra-aurora',
    name: 'Centro Comercial Aurora Plaza',
    code: 'OBR-002',
    address: 'Rua das Flores, 450 - Moema, SP',
    manager: 'Eng. Beatriz Siqueira',
    status: 'EM_ANDAMENTO',
    budgetTotal: 820000.0,
    consumedValue: 312800.0,
    startDate: '2025-08-01',
    expectedEndDate: '2026-12-15',
  },
  {
    id: 'obra-galpao-sul',
    name: 'Galpão Logístico & Centro de Distribuição Sul',
    code: 'OBR-003',
    address: 'Rodovia dos Imigrantes, KM 28 - Diadema, SP',
    manager: 'Eng. Carlos Gomes',
    status: 'PLANEJAMENTO',
    budgetTotal: 1250000.0,
    consumedValue: 45000.0,
    startDate: '2026-09-01',
    expectedEndDate: '2027-11-30',
  },
  {
    id: 'obra-cond-paraiso',
    name: 'Condomínio Reserva do Paraíso',
    code: 'OBR-004',
    address: 'Estrada do Paraíso, 1200 - Cotia, SP',
    manager: 'Eng. Fernando Borges',
    status: 'CONCLUIDA',
    budgetTotal: 380000.0,
    consumedValue: 374200.0,
    startDate: '2024-03-10',
    expectedEndDate: '2025-12-20',
  },
];

export const INITIAL_CAUTIONS: ToolCaution[] = [];

export const INITIAL_SETTINGS: AppSettings = {
  companyName: 'Borges & Gomes Engenharia',
  theme: 'light',
  autoBackup: true,
  backupIntervalHours: 4,
  soundAlerts: true,
  lowStockThresholdNotification: true,
  cloudSyncEnabled: true,
  cloudSyncUrl: '',
  defaultWarehouse: 'Almoxarifado Principal',
  currencySymbol: 'R$',
};

export const KNOWLEDGE_BASE_TOPICS = [
  {
    id: 'curva-abc',
    title: 'Gestão por Curva ABC de Estoque',
    category: 'Estratégia & Valor',
    tag: 'Metodologia 80-15-5',
    summary: 'Priorização de controle baseada no impacto financeiro e representatividade dos itens.',
    content: `
### O que é a Curva ABC?
A Curva ABC é uma metodologia baseada no Teorema de Pareto (80/20) para categorizar itens em estoque por relevância de capital investido:

- **Classe A (Alta relevância):** ~20% dos itens físicos que representam ~80% do valor monetário do estoque. Exigem controle rigoroso, inventário semanal ou diário e contagem cega.
- **Classe B (Média relevância):** ~30% dos itens que somam ~15% do valor total. Controle moderado com pedidos quinzenais/mensais.
- **Classe C (Baixa relevância):** ~50% dos itens correspondentes a apenas ~5% do valor (parafusos, arruelas, etc). Controle simplificado com lotes maiores para evitar burocracia.
    `,
  },
  {
    id: 'ponto-de-pedido',
    title: 'Cálculo de Ponto de Pedido (PP) e Estoque de Segurança (ES)',
    category: 'Planejamento',
    tag: 'Fórmulas Matemáticas',
    summary: 'Como calcular o momento exato de disparar a compra para nunca sofrer desabastecimento.',
    content: `
### Como Calcular o Ponto de Pedido (PP)?
O Ponto de Pedido é o gatilho no sistema que avisa que a ordem de compra deve ser gerada.

$$\\text{PP} = (\\text{Consumo Médio Diário} \\times \\text{Lead Time em Dias}) + \\text{Estoque de Segurança}$$
    `,
  },
  {
    id: 'metodo-peps-fifo',
    title: 'PEPS (Primeiro a Entrar, Primeiro a Sair / FIFO)',
    category: 'Operação',
    tag: 'Boas Práticas de Movimentação',
    summary: 'Garantia de que lotes mais antigos ou perecíveis sejam consumidos antes de lotes novos.',
    content: `
### Por que usar PEPS no Almoxarifado?
O método PEPS (FIFO) evita envelhecimento, perda de prazo de validade de insumos químicos e depreciação física de insumos.

1. **Endereçamento com Rotatividade:** Ao abastecer uma prateleira, coloque os itens novos atrás dos itens já existentes.
2. **Controle de Lotes:** Registre sempre o número do Lote e a Data de Validade na tela de Entrada.
3. **Conferência em Separação:** O operador deve sempre ler o código do item da frente da gaveta.
    `,
  },
  {
    id: 'metodologia-5s',
    title: 'Metodologia 5S no Almoxarifado Industrial',
    category: 'Organização',
    tag: 'Padrão de Excelência',
    summary: 'Como transformar o almoxarifado em um ambiente limpo, seguro e com zero tempo de busca.',
    content: `
### Os 5 Sensos Aplicados:
1. **Seiri (Descarte / Utilização):** Separe itens obsoletos, ferramentas quebradas e sucatas para área de quarentena.
2. **Seiton (Organização / Endereçamento):** "Um lugar para cada coisa e cada coisa no seu lugar". Etiquete todas as prateleiras, níveis e gavetas com códigos legíveis.
3. **Seiso (Limpeza):** Mantenha pisos desobstruídos, livres de óleo e estantes limpas.
4. **Seiketsu (Padronização):** Cores e identificações visuais padronizadas por categoria.
5. **Shitsuke (Disciplina):** Todo item retirado deve ter registro de saída no sistema no mesmo instante.
    `,
  },
  {
    id: 'conferencia-cega',
    title: 'Conferência Cega e Inventário Rotativo',
    category: 'Auditoria',
    tag: 'Acuracidade de 99.5%',
    summary: 'Eliminando desvios de contagem e garantindo precisão entre o físico e o sistema.',
    content: `
### O que é a Conferência Cega?
Na conferência cega, o almoxarife recebe apenas a lista de itens a contar sem saber a quantidade teórica do sistema. Isso elimina o vício de confirmação rápida ou suposições.

- Realize contagens rotativas regulares.
- Divergências relevantes geram recontagem imediata por um segundo operador.
    `,
  },
];
