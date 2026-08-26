import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_MOVEMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_SETTINGS,
} from '../data/initialData';

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
  PRODUCTS: 'borges_gomes_products_v1',
  MOVEMENTS: 'borges_gomes_movements_v1',
  SUPPLIERS: 'borges_gomes_suppliers_v1',
  SETTINGS: 'borges_gomes_settings_v1',
  BACKUPS: 'borges_gomes_backups_v1',
  SYNC_QUEUE: 'borges_gomes_sync_queue_v1',
  LAST_SYNC: 'borges_gomes_last_sync_v1',
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
    // Ignore audio context autoplay restrictions gracefully
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
      return saved ? JSON.parse(saved) : [
        {
          id: 'bcp-01',
          timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
          totalProducts: 10,
          totalMovements: 6,
          sizeKb: 14.8,
          status: 'SUCCESS',
        },
      ];
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
    // Apply theme class to document body
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

  // 3. Online/Offline Listener & Auto-Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto trigger sync on reconnect
      syncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 4. Calculate Alerts on Product or Movement change
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

      // Expiry Date check
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
            suggestedReorderQuantity: 0,
            estimatedCost: 0,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    setAlerts(newAlerts);
  }, [products]);

  // 5. Automatic periodic Cloud Backup check
  useEffect(() => {
    if (!settings.autoBackup) return;
    const intervalMs = settings.backupIntervalHours * 3600 * 1000;
    const timer = setInterval(() => {
      createCloudBackup();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [settings.autoBackup, settings.backupIntervalHours, products, movements]);

  // 6. Sound player helper
  const playBeepSound = useCallback((type: 'success' | 'warning' | 'error' = 'success') => {
    if (settings.soundAlerts) {
      playAudioTone(type);
    }
  }, [settings.soundAlerts]);

  // 7. Product Operations
  const addProduct = useCallback(
    (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'lastMovementDate'>): Product => {
      const now = new Date().toISOString();
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: now,
        updatedAt: now,
        lastMovementDate: now,
      };

      setProducts((prev) => [newProduct, ...prev]);

      // If product was created with positive initial stock, generate a SALDO_INICIAL movement
      if (newProduct.currentStock > 0) {
        const initialMovement: StockMovement = {
          id: `mov-${Date.now()}`,
          productId: newProduct.id,
          productName: newProduct.name,
          productSku: newProduct.sku,
          type: 'ENTRADA',
          reason: 'SALDO_INICIAL',
          quantity: newProduct.currentStock,
          previousStock: 0,
          newStock: newProduct.currentStock,
          unitCost: newProduct.costPrice,
          totalCost: newProduct.currentStock * newProduct.costPrice,
          documentNumber: 'CADASTRO_INICIAL',
          requesterSector: 'Almoxarifado Geral',
          operatorName: 'Administrador Borges e Gomes',
          notes: 'Cadastro inicial de produto no catálogo.',
          timestamp: now,
          synced: isOnline,
        };
        setMovements((prev) => [initialMovement, ...prev]);
      }

      playBeepSound('success');
      return newProduct;
    },
    [isOnline, playBeepSound]
  );

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    playBeepSound('success');
  }, [playBeepSound]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    playBeepSound('warning');
  }, [playBeepSound]);

  const getProductByBarcodeOrSku = useCallback(
    (code: string): Product | undefined => {
      const trimmed = code.trim().toLowerCase();
      if (!trimmed) return undefined;
      return products.find(
        (p) =>
          p.barcode.toLowerCase() === trimmed ||
          p.sku.toLowerCase() === trimmed ||
          p.id.toLowerCase() === trimmed
      );
    },
    [products]
  );

  // 8. Register Stock Movement (ENTRADA / SAÍDA / AJUSTE / TRANSFERÊNCIA)
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
        return { success: false, error: 'Produto não encontrado no sistema.' };
      }

      const qty = Math.abs(data.quantity);
      if (qty <= 0) {
        playBeepSound('error');
        return { success: false, error: 'Quantidade de movimentação deve ser maior que zero.' };
      }

      const prevStock = product.currentStock;
      let newStock = prevStock;

      if (data.type === 'ENTRADA') {
        newStock = prevStock + qty;
      } else if (data.type === 'SAIDA') {
        if (prevStock < qty) {
          playBeepSound('error');
          return {
            success: false,
            error: `Estoque insuficiente! Saldo disponível: ${prevStock} ${product.unit}, solicitação: ${qty} ${product.unit}.`,
          };
        }
        newStock = prevStock - qty;
      } else if (data.type === 'AJUSTE') {
        newStock = data.quantity; // In adjustment, quantity is the new physical counted stock
      }

      const costPerUnit = data.unitCost !== undefined && data.unitCost > 0 ? data.unitCost : product.costPrice;
      const totalCostCalc = (data.type === 'AJUSTE' ? Math.abs(newStock - prevStock) : qty) * costPerUnit;
      const now = new Date().toISOString();

      const newMovement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        type: data.type,
        reason: data.reason,
        quantity: data.type === 'AJUSTE' ? Math.abs(newStock - prevStock) : qty,
        previousStock: prevStock,
        newStock: newStock,
        unitCost: costPerUnit,
        totalCost: totalCostCalc,
        documentNumber: data.documentNumber?.trim(),
        requesterSector: data.requesterSector?.trim() || 'Almoxarifado Central',
        operatorName: data.operatorName.trim() || 'Operador Borges e Gomes',
        employeeName: data.employeeName?.trim() || undefined,
        notes: data.notes?.trim(),
        timestamp: now,
        synced: isOnline,
      };

      // Update product stock and lastMovementDate
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                currentStock: newStock,
                costPrice: data.unitCost && data.type === 'ENTRADA' ? data.unitCost : p.costPrice,
                lastMovementDate: now,
                updatedAt: now,
              }
            : p
        )
      );

      setMovements((prev) => [newMovement, ...prev]);

      if (newStock <= product.minStock) {
        playBeepSound('warning');
      } else {
        playBeepSound('success');
      }

      return { success: true, movement: newMovement };
    },
    [products, isOnline, playBeepSound]
  );

  // 9. External Supplier API Integration (Price auto-update & comparison)
  const fetchExternalSupplierQuotes = useCallback(async (): Promise<SupplierPriceQuote[]> => {
    setIsSyncing(true);
    // Simulating external REST API calls to all registered active suppliers with realistic price market swings
    await new Promise((resolve) => setTimeout(resolve, 900));

    const quotes: SupplierPriceQuote[] = products.map((prod) => {
      const sup = suppliers.find((s) => s.id === prod.supplierId) || suppliers[0];
      // Random price variation factor between -8% and +12% based on market inflation/commodity rates
      const variationFactor = 1 + (Math.sin(prod.name.length * 7 + Date.now() / 100000) * 0.10);
      const quotedPrice = Number((prod.costPrice * variationFactor).toFixed(2));
      const changePct = Number((((quotedPrice - prod.costPrice) / prod.costPrice) * 100).toFixed(1));

      return {
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.name,
        supplierId: sup.id,
        supplierName: sup.name,
        currentSystemCost: prod.costPrice,
        newQuotedPrice: quotedPrice,
        currency: 'BRL',
        lastUpdated: new Date().toISOString(),
        leadTimeDays: sup.leadTimeDays,
        availability: Math.random() > 0.3 ? 'IMMEDIATE' : '2_5_DAYS',
        priceChangePercent: changePct,
      };
    });

    setSupplierQuotes(quotes);
    setIsSyncing(false);
    return quotes;
  }, [products, suppliers]);

  const applySupplierPriceUpdate = useCallback(
    (productId: string, newCostPrice: number) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                costPrice: newCostPrice,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
      // Remove applied quote from pending list
      setSupplierQuotes((prev) => prev.filter((q) => q.productId !== productId));
      playBeepSound('success');
    },
    [playBeepSound]
  );

  const applyAllSupplierPriceUpdates = useCallback(() => {
    if (supplierQuotes.length === 0) return;
    setProducts((prev) =>
      prev.map((p) => {
        const quote = supplierQuotes.find((q) => q.productId === p.id);
        if (quote) {
          return {
            ...p,
            costPrice: quote.newQuotedPrice,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    setSupplierQuotes([]);
    playBeepSound('success');
  }, [supplierQuotes, playBeepSound]);

  // 10. Supplier Management
  const addSupplier = useCallback((supplierData: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
    };
    setSuppliers((prev) => [...prev, newSup]);
    playBeepSound('success');
  }, [playBeepSound]);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    playBeepSound('success');
  }, [playBeepSound]);

  // 11. Settings & Themes
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  // 12. Backup & Sync Operations
  const pendingSyncCount = movements.filter((m) => !m.synced).length;

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mark all movements as synced
    setMovements((prev) => prev.map((m) => ({ ...m, synced: true })));
    const nowIso = new Date().toISOString();
    setLastSyncTime(nowIso);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, nowIso);
    setIsSyncing(false);
    playBeepSound('success');
  }, [playBeepSound]);

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
      app: 'Borges e Gomes - Almoxarifado',
      exportedAt: new Date().toISOString(),
      products,
      movements,
      suppliers,
      settings,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Borges_e_Gomes_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playBeepSound('success');
  }, [products, movements, suppliers, settings, playBeepSound]);

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

  // 13. Inventory Stats Calculations
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
    stockAccuracyPercent: 99.4,
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
