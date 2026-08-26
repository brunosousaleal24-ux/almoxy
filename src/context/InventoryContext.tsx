import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Product,
  StockMovement,
  Supplier,
  SupplierPriceQuote,
  StockAlert,
  AppSettings,
  CloudBackupRecord,
  InventoryStats,
  MovementType,
  MovementReason,
  ToolUsageRanking,
  EmployeeRanking,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_MOVEMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_SETTINGS,
} from '../data/initialData';
import {
  firebaseConfig,
  db,
  testFirestoreConnection,
  seedInitialFirestoreData,
  saveProductToFirestore,
  saveMovementToFirestore,
  saveSupplierToFirestore,
  saveSettingsToFirestore,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

export interface FirebaseStatusInfo {
  connected: boolean;
  projectId: string;
  lastSyncTime: string;
  isSyncing: boolean;
  message: string;
}

interface InventoryContextType {
  products: Product[];
  movements: StockMovement[];
  suppliers: Supplier[];
  supplierQuotes: SupplierPriceQuote[];
  alerts: StockAlert[];
  settings: AppSettings;
  backupHistory: CloudBackupRecord[];
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncTime: string;
  stats: InventoryStats;

  // Rankings
  toolsRanking: ToolUsageRanking[];
  employeeRanking: EmployeeRanking[];

  // Firebase
  firebaseStatus: FirebaseStatusInfo;
  syncWithFirebase: () => Promise<void>;

  // Product Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'lastMovementDate'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductByBarcodeOrSku: (code: string) => Product | undefined;

  // Movement Actions
  registerMovement: (data: {
    productId: string;
    type: MovementType;
    reason: MovementReason;
    quantity: number;
    documentNumber?: string;
    requesterSector?: string;
    operatorName: string;
    employeeName?: string;
    notes?: string;
    unitCost?: number;
  }) => { success: boolean; movement?: StockMovement; error?: string };

  // Supplier & Price API Actions
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  fetchExternalSupplierQuotes: () => Promise<SupplierPriceQuote[]>;
  applySupplierPriceUpdate: (productId: string, newCostPrice: number) => void;
  applyAllSupplierPriceUpdates: () => void;

  // Settings & Theme
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleTheme: () => void;

  // Backup & Sync Actions
  syncNow: () => Promise<void>;
  createCloudBackup: () => CloudBackupRecord;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonString: string) => boolean;
  resetToDefaults: () => void;

  // Audio / Feedback
  playBeepSound: (type?: 'success' | 'warning' | 'error') => void;
  dismissAlert: (alertId: string) => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

const STORAGE_KEYS = {
  PRODUCTS: 'almoxarifado_products_v2',
  MOVEMENTS: 'almoxarifado_movements_v2',
  SUPPLIERS: 'almoxarifado_suppliers_v2',
  SETTINGS: 'almoxarifado_settings_v2',
  BACKUPS: 'almoxarifado_backups_v2',
  SYNC_QUEUE: 'almoxarifado_sync_queue_v2',
  LAST_SYNC: 'almoxarifado_last_sync_v2',
};

// Web Audio API beep sound generator
function playAudioTone(type: 'success' | 'warning' | 'error' = 'success') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'warning') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Ignore audio restrictions
  }
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State Loading from LocalStorage
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
    } catch {
      return INITIAL_MOVEMENTS;
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [backupHistory, setBackupHistory] = useState<CloudBackupRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKUPS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || new Date().toISOString();
  });
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierPriceQuote[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseStatusInfo>({
    connected: false,
    projectId: firebaseConfig.projectId,
    lastSyncTime: new Date().toISOString(),
    isSyncing: false,
    message: 'Inicializando conexão com Firebase...',
  });

  const playBeepSound = useCallback((type: 'success' | 'warning' | 'error' = 'success') => {
    if (settings.beepSoundEnabled) {
      playAudioTone(type);
    }
  }, [settings.beepSoundEnabled]);

  // 2. Save persistence whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backupHistory));
  }, [backupHistory]);

  // 3. Online / Offline & Firebase Initialization
  useEffect(() => {
    const checkConn = async () => {
      const res = await testFirestoreConnection();
      setFirebaseStatus((prev) => ({
        ...prev,
        connected: res.connected,
        message: res.message,
        lastSyncTime: new Date().toISOString(),
      }));

      if (res.connected) {
        // Seed initial data if Firestore is empty
        await seedInitialFirestoreData(products, movements, suppliers);
      }
    };

    checkConn();

    const handleOnline = () => {
      setIsOnline(true);
      checkConn();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setFirebaseStatus((prev) => ({
        ...prev,
        connected: false,
        message: 'Modo Offline: dados salvos localmente',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 4. Real-time Firestore Listeners with Offline IndexedDB Support
  useEffect(() => {
    try {
      const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudProds: Product[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Product;
            if (data.id && data.sku) {
              cloudProds.push(data);
            }
          });
          if (cloudProds.length > 0) {
            setProducts(cloudProds);
          }
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
      });

      const unsubMovements = onSnapshot(collection(db, 'movements'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudMovs: StockMovement[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as StockMovement;
            if (data.id && data.productId) {
              cloudMovs.push(data);
            }
          });
          if (cloudMovs.length > 0) {
            setMovements(cloudMovs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
          }
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'movements');
      });

      return () => {
        unsubProducts();
        unsubMovements();
      };
    } catch (e) {
      console.warn('Firestore snapshot setup error:', e);
    }
  }, []);

  // 5. Calculate Alerts
  useEffect(() => {
    const newAlerts: StockAlert[] = [];
    const now = new Date();

    products.forEach((p) => {
      if (p.currentStock === 0) {
        const reorderQty = Math.max(p.maxStock - p.currentStock, p.minStock * 2);
        newAlerts.push({
          id: `alt-crit-${p.id}`,
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          type: 'CRITICO',
          severity: 'high',
          message: `Estoque Esgotado (0 ${p.unit})! Ruptura de estoque no almoxarifado.`,
          currentStock: p.currentStock,
          minStock: p.minStock,
          suggestedReorderQuantity: reorderQty,
          estimatedCost: reorderQty * p.costPrice,
          createdAt: new Date().toISOString(),
        });
      } else if (p.currentStock <= p.minStock) {
        const reorderQty = p.maxStock - p.currentStock;
        newAlerts.push({
          id: `alt-low-${p.id}`,
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          type: 'BAIXO',
          severity: p.currentStock <= p.safetyStock ? 'high' : 'medium',
          message: `Nível abaixo do mínimo (${p.currentStock}/${p.minStock} ${p.unit}). Acione pedido de compra.`,
          currentStock: p.currentStock,
          minStock: p.minStock,
          suggestedReorderQuantity: reorderQty,
          estimatedCost: reorderQty * p.costPrice,
          createdAt: new Date().toISOString(),
        });
      }

      if (p.expiryDate) {
        const exp = new Date(p.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 60 && diffDays > 0) {
          newAlerts.push({
            id: `alt-exp-${p.id}`,
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            type: 'VENCIMENTO_PROXIMO',
            severity: diffDays <= 20 ? 'high' : 'low',
            message: `Validade do Lote em ${diffDays} dias (${p.expiryDate}). Priorize aplicação PEPS/FIFO.`,
            currentStock: p.currentStock,
            minStock: p.minStock,
            suggestedReorderQuantity: p.maxStock,
            estimatedCost: p.maxStock * p.costPrice,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    setAlerts(newAlerts);
  }, [products]);

  // 6. Tools Ranking Calculation
  const toolsRanking: ToolUsageRanking[] = useMemo(() => {
    const toolStatsMap: Record<string, {
      timesRequested: number;
      totalQuantityUsed: number;
      totalValueUsed: number;
      lastUsedDate: string;
      employeeCounts: Record<string, number>;
      sectorCounts: Record<string, number>;
    }> = {};

    movements.forEach((m) => {
      if (m.type === 'SAIDA') {
        if (!toolStatsMap[m.productId]) {
          toolStatsMap[m.productId] = {
            timesRequested: 0,
            totalQuantityUsed: 0,
            totalValueUsed: 0,
            lastUsedDate: m.timestamp,
            employeeCounts: {},
            sectorCounts: {},
          };
        }
        const st = toolStatsMap[m.productId];
        st.timesRequested += 1;
        st.totalQuantityUsed += m.quantity;
        st.totalValueUsed += m.totalCost || (m.quantity * m.unitCost);
        if (new Date(m.timestamp) > new Date(st.lastUsedDate)) {
          st.lastUsedDate = m.timestamp;
        }
        const emp = m.employeeName || m.operatorName || 'Colaborador';
        st.employeeCounts[emp] = (st.employeeCounts[emp] || 0) + m.quantity;
        const sec = m.requesterSector || 'Geral';
        st.sectorCounts[sec] = (st.sectorCounts[sec] || 0) + m.quantity;
      }
    });

    return products
      .filter((p) => p.category === 'Ferramentas' || (toolStatsMap[p.id]?.timesRequested || 0) > 0)
      .map((p) => {
        const st = toolStatsMap[p.id] || {
          timesRequested: 0,
          totalQuantityUsed: 0,
          totalValueUsed: 0,
          lastUsedDate: p.lastMovementDate || p.updatedAt,
          employeeCounts: {},
          sectorCounts: {},
        };

        let topEmployee = 'Nenhum';
        let maxEmpCount = 0;
        Object.entries(st.employeeCounts).forEach(([emp, count]) => {
          if (count > maxEmpCount) {
            maxEmpCount = count;
            topEmployee = emp;
          }
        });

        let topSector = 'Geral';
        let maxSecCount = 0;
        Object.entries(st.sectorCounts).forEach(([sec, count]) => {
          if (count > maxSecCount) {
            maxSecCount = count;
            topSector = sec;
          }
        });

        return {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          unit: p.unit,
          currentStock: p.currentStock,
          costPrice: p.costPrice,
          timesRequested: st.timesRequested,
          totalQuantityUsed: st.totalQuantityUsed,
          totalValueUsed: st.totalValueUsed,
          lastUsedDate: st.lastUsedDate,
          topEmployee,
          topSector,
        };
      })
      .sort((a, b) => {
        if (b.timesRequested !== a.timesRequested) {
          return b.timesRequested - a.timesRequested;
        }
        return b.totalQuantityUsed - a.totalQuantityUsed;
      });
  }, [products, movements]);

  // 7. Employee Ranking Calculation
  const employeeRanking: EmployeeRanking[] = useMemo(() => {
    const empMap: Record<string, {
      employeeName: string;
      sector: string;
      totalMovements: number;
      totalItemsTaken: number;
      totalValueTaken: number;
      toolsTakenCount: number;
      itemCounts: Record<string, number>;
      lastActiveDate: string;
    }> = {};

    movements.forEach((m) => {
      if (m.type === 'SAIDA') {
        const empName = m.employeeName || m.operatorName || 'Colaborador';
        if (!empMap[empName]) {
          empMap[empName] = {
            employeeName: empName,
            sector: m.requesterSector || 'Almoxarifado Central',
            totalMovements: 0,
            totalItemsTaken: 0,
            totalValueTaken: 0,
            toolsTakenCount: 0,
            itemCounts: {},
            lastActiveDate: m.timestamp,
          };
        }

        const emp = empMap[empName];
        emp.totalMovements += 1;
        emp.totalItemsTaken += m.quantity;
        emp.totalValueTaken += m.totalCost || (m.quantity * m.unitCost);
        emp.itemCounts[m.productName] = (emp.itemCounts[m.productName] || 0) + m.quantity;
        if (new Date(m.timestamp) > new Date(emp.lastActiveDate)) {
          emp.lastActiveDate = m.timestamp;
        }
        if (m.requesterSector) {
          emp.sector = m.requesterSector;
        }

        const prod = products.find((p) => p.id === m.productId);
        if (prod?.category === 'Ferramentas') {
          emp.toolsTakenCount += m.quantity;
        }
      }
    });

    return Object.values(empMap).map((emp) => {
      let mostUsedItem = 'Nenhum';
      let maxCount = 0;
      Object.entries(emp.itemCounts).forEach(([item, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostUsedItem = item;
        }
      });

      return {
        employeeName: emp.employeeName,
        sector: emp.sector,
        totalMovements: emp.totalMovements,
        totalItemsTaken: emp.totalItemsTaken,
        totalValueTaken: emp.totalValueTaken,
        toolsTakenCount: emp.toolsTakenCount,
        mostUsedItem,
        lastActiveDate: emp.lastActiveDate,
      };
    }).sort((a, b) => {
      if (b.totalMovements !== a.totalMovements) {
        return b.totalMovements - a.totalMovements;
      }
      return b.totalItemsTaken - a.totalItemsTaken;
    });
  }, [products, movements]);

  // Product Actions
  const addProduct = useCallback((productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'lastMovementDate'>) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
      lastMovementDate: now,
    };
    setProducts((prev) => [newProduct, ...prev]);
    saveProductToFirestore(newProduct);
    playBeepSound('success');
    return newProduct;
  }, [playBeepSound]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates, updatedAt: now };
          saveProductToFirestore(updated);
          return updated;
        }
        return p;
      })
    );
    playBeepSound('success');
  }, [playBeepSound]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.warn('Delete product error:', e);
    }
    playBeepSound('warning');
  }, [playBeepSound]);

  const getProductByBarcodeOrSku = useCallback(
    (code: string): Product | undefined => {
      const cleanCode = code.trim().toLowerCase();
      return products.find(
        (p) =>
          p.barcode.toLowerCase() === cleanCode ||
          p.sku.toLowerCase() === cleanCode ||
          p.id.toLowerCase() === cleanCode
      );
    },
    [products]
  );

  // Movement Action
  const registerMovement = useCallback(
    (data: {
      productId: string;
      type: MovementType;
      reason: MovementReason;
      quantity: number;
      documentNumber?: string;
      requesterSector?: string;
      operatorName: string;
      employeeName?: string;
      notes?: string;
      unitCost?: number;
    }) => {
      const product = products.find((p) => p.id === data.productId);
      if (!product) {
        playBeepSound('error');
        return { success: false, error: 'Produto não encontrado no estoque.' };
      }

      if (data.quantity <= 0) {
        playBeepSound('error');
        return { success: false, error: 'Quantidade informada deve ser maior que zero.' };
      }

      const previousStock = product.currentStock;
      let newStock = previousStock;

      if (data.type === 'ENTRADA') {
        newStock = previousStock + data.quantity;
      } else if (data.type === 'SAIDA') {
        if (previousStock < data.quantity) {
          playBeepSound('error');
          return {
            success: false,
            error: `Saldo insuficiente em estoque! Disponível: ${previousStock} ${product.unit}, Solicitado: ${data.quantity} ${product.unit}.`,
          };
        }
        newStock = previousStock - data.quantity;
      } else if (data.type === 'AJUSTE') {
        newStock = data.quantity;
      }

      const unitCost = data.unitCost !== undefined ? data.unitCost : product.costPrice;
      const totalCost = unitCost * (data.type === 'AJUSTE' ? Math.abs(newStock - previousStock) : data.quantity);
      const now = new Date().toISOString();

      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        type: data.type,
        reason: data.reason,
        quantity: data.quantity,
        previousStock,
        newStock,
        unitCost,
        totalCost,
        documentNumber: data.documentNumber?.trim(),
        requesterSector: data.requesterSector?.trim() || 'Almoxarifado Central',
        operatorName: data.operatorName.trim() || 'Almoxarife',
        employeeName: data.employeeName?.trim() || undefined,
        notes: data.notes?.trim(),
        timestamp: now,
        synced: isOnline,
      };

      // 1. Update Product stock
      const updatedProduct: Product = {
        ...product,
        currentStock: newStock,
        lastMovementDate: now,
        updatedAt: now,
        ...(data.type === 'ENTRADA' && data.unitCost ? { costPrice: data.unitCost } : {}),
      };

      setProducts((prev) => prev.map((p) => (p.id === product.id ? updatedProduct : p)));
      setMovements((prev) => [movement, ...prev]);

      // 2. Persist to Firestore
      saveMovementToFirestore(movement);
      saveProductToFirestore(updatedProduct);

      playBeepSound('success');
      return { success: true, movement };
    },
    [products, isOnline, playBeepSound]
  );

  // Supplier Actions
  const addSupplier = useCallback((supplierData: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    saveSupplierToFirestore(newSupplier);
    playBeepSound('success');
  }, [playBeepSound]);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const upd = { ...s, ...updates };
          saveSupplierToFirestore(upd);
          return upd;
        }
        return s;
      })
    );
    playBeepSound('success');
  }, [playBeepSound]);

  const fetchExternalSupplierQuotes = useCallback(async (): Promise<SupplierPriceQuote[]> => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 750));

    const simulatedQuotes: SupplierPriceQuote[] = products.map((prod) => {
      const sup = suppliers.find((s) => s.id === prod.supplierId) || suppliers[0];
      const variance = (Math.random() * 0.16) - 0.08;
      const newPrice = Number((prod.costPrice * (1 + variance)).toFixed(2));
      const pct = Number((((newPrice - prod.costPrice) / prod.costPrice) * 100).toFixed(1));

      return {
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.name,
        supplierId: sup.id,
        supplierName: sup.name,
        currentSystemCost: prod.costPrice,
        newQuotedPrice: newPrice,
        currency: 'BRL',
        lastUpdated: new Date().toISOString(),
        leadTimeDays: sup.leadTimeDays || 3,
        availability: Math.random() > 0.3 ? 'IMMEDIATE' : '2_5_DAYS',
        priceChangePercent: pct,
      };
    });

    setSupplierQuotes(simulatedQuotes);
    setIsSyncing(false);
    playBeepSound('success');
    return simulatedQuotes;
  }, [products, suppliers, playBeepSound]);

  const applySupplierPriceUpdate = useCallback((productId: string, newCostPrice: number) => {
    updateProduct(productId, { costPrice: newCostPrice });
    setSupplierQuotes((prev) => prev.filter((q) => q.productId !== productId));
  }, [updateProduct]);

  const applyAllSupplierPriceUpdates = useCallback(() => {
    supplierQuotes.forEach((quote) => {
      updateProduct(quote.productId, { costPrice: quote.newQuotedPrice });
    });
    setSupplierQuotes([]);
    playBeepSound('success');
  }, [supplierQuotes, updateProduct, playBeepSound]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates };
      saveSettingsToFirestore(updated);
      return updated;
    });
    playBeepSound('success');
  }, [playBeepSound]);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => {
      const nextTheme = prev.theme === 'dark' ? 'light' : 'dark';
      const upd = { ...prev, theme: nextTheme as 'light' | 'dark' };
      saveSettingsToFirestore(upd);
      return upd;
    });
  }, []);

  const syncWithFirebase = useCallback(async () => {
    setIsSyncing(true);
    setFirebaseStatus((prev) => ({ ...prev, isSyncing: true, message: 'Sincronizando com Firestore...' }));
    
    try {
      const res = await testFirestoreConnection();
      if (res.connected) {
        await seedInitialFirestoreData(products, movements, suppliers);
        const nowIso = new Date().toISOString();
        setLastSyncTime(nowIso);
        setFirebaseStatus({
          connected: true,
          projectId: firebaseConfig.projectId,
          lastSyncTime: nowIso,
          isSyncing: false,
          message: `Sincronizado com sucesso com Firebase (${firebaseConfig.projectId})`,
        });
        playBeepSound('success');
      } else {
        setFirebaseStatus({
          connected: false,
          projectId: firebaseConfig.projectId,
          lastSyncTime: new Date().toISOString(),
          isSyncing: false,
          message: 'Falha ao sincronizar com Firebase: ' + res.message,
        });
        playBeepSound('error');
      }
    } catch (e: any) {
      setFirebaseStatus({
        connected: false,
        projectId: firebaseConfig.projectId,
        lastSyncTime: new Date().toISOString(),
        isSyncing: false,
        message: 'Erro: ' + (e?.message || 'Falha de conexão'),
      });
      playBeepSound('error');
    } finally {
      setIsSyncing(false);
    }
  }, [products, movements, suppliers, playBeepSound]);

  const syncNow = useCallback(async () => {
    await syncWithFirebase();
  }, [syncWithFirebase]);

  const createCloudBackup = useCallback((): CloudBackupRecord => {
    const snapshot = {
      version: '1.0',
      company: settings.companyName,
      timestamp: new Date().toISOString(),
      products,
      movements,
      suppliers,
      settings,
    };
    const jsonStr = JSON.stringify(snapshot);
    const sizeKb = Number((new Blob([jsonStr]).size / 1024).toFixed(1));

    const record: CloudBackupRecord = {
      id: `bcp-${Date.now()}`,
      timestamp: snapshot.timestamp,
      totalProducts: products.length,
      totalMovements: movements.length,
      sizeKb,
      status: 'SUCCESS',
    };

    setBackupHistory((prev) => [record, ...prev.slice(0, 9)]);
    return record;
  }, [products, movements, suppliers, settings]);

  const exportDatabaseJson = useCallback(() => {
    const snapshot = {
      app: 'Almoxarifado & Logística',
      firebaseProject: firebaseConfig.projectId,
      exportedAt: new Date().toISOString(),
      products,
      movements,
      suppliers,
      settings,
      toolsRanking,
      employeeRanking,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Almoxarifado_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playBeepSound('success');
  }, [products, movements, suppliers, settings, toolsRanking, employeeRanking, playBeepSound]);

  const importDatabaseJson = useCallback(
    (jsonString: string): boolean => {
      try {
        const data = JSON.parse(jsonString);
        if (Array.isArray(data.products) && Array.isArray(data.movements)) {
          setProducts(data.products);
          setMovements(data.movements);
          if (Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
          if (data.settings) setSettings(data.settings);
          createCloudBackup();
          playBeepSound('success');
          return true;
        }
        playBeepSound('error');
        return false;
      } catch {
        playBeepSound('error');
        return false;
      }
    },
    [createCloudBackup, playBeepSound]
  );

  const resetToDefaults = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setMovements(INITIAL_MOVEMENTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setSettings(INITIAL_SETTINGS);
    playBeepSound('warning');
  }, [playBeepSound]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const pendingSyncCount = movements.filter((m) => !m.synced).length;

  // Inventory Stats Calculations
  const stats: InventoryStats = {
    totalItems: products.reduce((acc, p) => acc + p.currentStock, 0),
    totalSkus: products.length,
    totalValuation: products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0),
    lowStockCount: products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length,
    criticalStockCount: products.filter((p) => p.currentStock === 0).length,
    movementsToday: movements.filter((m) => {
      const today = new Date().toISOString().slice(0, 10);
      return m.timestamp.startsWith(today);
    }).length,
    entriesToday: movements.filter((m) => {
      const today = new Date().toISOString().slice(0, 10);
      return m.timestamp.startsWith(today) && m.type === 'ENTRADA';
    }).length,
    exitsToday: movements.filter((m) => {
      const today = new Date().toISOString().slice(0, 10);
      return m.timestamp.startsWith(today) && m.type === 'SAIDA';
    }).length,
    stockAccuracyPercent: 99.6,
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        movements,
        suppliers,
        supplierQuotes,
        alerts,
        settings,
        backupHistory,
        isOnline,
        isSyncing,
        pendingSyncCount,
        lastSyncTime,
        stats,
        toolsRanking,
        employeeRanking,
        firebaseStatus,
        syncWithFirebase,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductByBarcodeOrSku,
        registerMovement,
        addSupplier,
        updateSupplier,
        fetchExternalSupplierQuotes,
        applySupplierPriceUpdate,
        applyAllSupplierPriceUpdates,
        updateSettings,
        toggleTheme,
        syncNow,
        createCloudBackup,
        exportDatabaseJson,
        importDatabaseJson,
        resetToDefaults,
        playBeepSound,
        dismissAlert,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
