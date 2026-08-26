export type MovementType = 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA' | 'AJUSTE';

export type MovementReason = 
  | 'COMPRA_NF'
  | 'DEVOLUCAO'
  | 'PRODUCAO'
  | 'SALDO_INICIAL'
  | 'REQUISICAO_SETOR'
  | 'CONSUMO_INTERNO'
  | 'MANUTENCAO'
  | 'OBRA_SERVICO'
  | 'PERDA_AVARIA'
  | 'DESCARTE'
  | 'INVENTARIO_CORRECAO'
  | 'TRANSFERENCIA_LOCAL';

export type ProductCategory = 
  | 'Ferramentas'
  | 'Elétrica'
  | 'Hidráulica'
  | 'EPIs & Segurança'
  | 'Fixação & Parafusos'
  | 'Químicos & Tintas'
  | 'Material de Escritório'
  | 'Peças & Mecânica'
  | 'Construção Civil'
  | 'Diversos';

export type StockStatus = 'ADEQUADO' | 'BAIXO' | 'CRITICO' | 'EXCESSO';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: ProductCategory;
  unit: 'UN' | 'CX' | 'KG' | 'M' | 'L' | 'PAR' | 'RL' | 'PC';
  currentStock: number;
  minStock: number;
  maxStock: number;
  safetyStock: number;
  costPrice: number;
  salePrice?: number;
  location: {
    warehouse: string;
    shelf: string;
    level: string;
    bin?: string;
  };
  supplierId: string;
  supplierName: string;
  batchNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  lastMovementDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  documentNumber?: string; // NF ou Ordem de Serviço
  requesterSector?: string; // Ex: Manutenção, Obra A, Elétrica
  operatorName: string; // Ex: Carlos Borges, Marcos Gomes (Almoxarife)
  employeeName?: string; // Ex: Roberto Ferreira, Lucas Silva (Colaborador que retirou)
  notes?: string;
  timestamp: string; // ISO String
  synced: boolean;
}

export interface ToolUsageRanking {
  productId: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: string;
  currentStock: number;
  costPrice: number;
  timesRequested: number;
  totalQuantityUsed: number;
  totalValueUsed: number;
  lastUsedDate: string;
  topEmployee: string;
  topSector: string;
}

export interface EmployeeRanking {
  employeeName: string;
  sector: string;
  totalMovements: number;
  totalItemsTaken: number;
  totalValueTaken: number;
  toolsTakenCount: number;
  mostUsedItem: string;
  lastActiveDate: string;
}

export interface Supplier {
  id: string;
  name: string;
  tradeName: string;
  cnpj: string;
  contactEmail: string;
  phone: string;
  leadTimeDays: number;
  rating: number; // 1-5
  apiEndpoint?: string;
  active: boolean;
}

export interface SupplierPriceQuote {
  productId: string;
  productSku: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  currentSystemCost: number;
  newQuotedPrice: number;
  currency: string;
  lastUpdated: string;
  leadTimeDays: number;
  availability: 'IMMEDIATE' | '2_5_DAYS' | 'ON_ORDER';
  priceChangePercent: number;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: 'CRITICO' | 'BAIXO' | 'VENCIMENTO_PROXIMO' | 'SEM_GIRO';
  severity: 'high' | 'medium' | 'low';
  message: string;
  currentStock: number;
  minStock: number;
  suggestedReorderQuantity: number;
  estimatedCost: number;
  createdAt: string;
  dismissed?: boolean;
}

export interface AppSettings {
  companyName: string;
  theme: 'light' | 'dark' | 'system';
  autoBackup: boolean;
  backupIntervalHours: number;
  soundAlerts: boolean;
  lowStockThresholdNotification: boolean;
  cloudSyncEnabled: boolean;
  cloudSyncUrl: string;
  defaultWarehouse: string;
  currencySymbol: string;
}

export interface CloudBackupRecord {
  id: string;
  timestamp: string;
  totalProducts: number;
  totalMovements: number;
  sizeKb: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'ALMOXARIFE' | 'OPERADOR' | 'AUDITOR';
  department: string;
  photoURL?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalSkus: number;
  totalValuation: number;
  lowStockCount: number;
  criticalStockCount: number;
  movementsToday: number;
  entriesToday: number;
  exitsToday: number;
  stockAccuracyPercent: number;
}
