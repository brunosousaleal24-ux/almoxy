import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocFromServer,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { Product, StockMovement, Supplier, AppSettings, Employee, ConstructionSite, ToolCaution } from '../types';

// Firebase configuration provided for contrupro-10f13
export const firebaseConfig = {
  apiKey: "AIzaSyATdF1huQQa1qaR3gFY1ixwNyX0WvFEo7U",
  authDomain: "contrupro-10f13.firebaseapp.com",
  projectId: "contrupro-10f13",
  storageBucket: "contrupro-10f13.firebasestorage.app",
  messagingSenderId: "381650667347",
  appId: "1:381650667347:web:5fece06131f2cee75c43a6",
  measurementId: "G-2V9QY8Y6EQ"
};

// Initialize Firebase App Singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configure Firebase Offline Support with IndexedDB persistence
export let isOfflinePersistenceEnabled = false;

export const initOfflinePersistence = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  try {
    await enableIndexedDbPersistence(db);
    isOfflinePersistenceEnabled = true;
    console.info('[Firestore] Suporte offline ativado com sucesso via enableIndexedDbPersistence (IndexedDB).');
    return true;
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('[Firestore Offline] Múltiplas abas abertas. A persistência IndexedDB opera na primeira aba ativa.');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firestore Offline] O navegador atual não possui suporte completo ao IndexedDB.');
    } else {
      console.warn('[Firestore Offline] Aviso ao inicializar persistência offline:', err?.message || err);
    }
    return false;
  }
};

// Auto-initialize offline persistence on module load
if (typeof window !== 'undefined') {
  initOfflinePersistence();
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
};
export type { User };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString(),
  };
  console.warn(`[Firestore ${operationType} on ${path || 'unknown'}]:`, errInfo.error);
  return errInfo;
}

// Check real connection to Firestore
export async function testFirestoreConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const testDoc = doc(db, '_status', 'connection_probe');
    await setDoc(testDoc, {
      lastProbe: serverTimestamp(),
      app: 'Almoxarifado & Logística',
      projectId: firebaseConfig.projectId
    }, { merge: true });
    return { connected: true, message: `Conectado em tempo real ao Firebase (${firebaseConfig.projectId})` };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, '_status/connection_probe');
    return { connected: false, message: error?.message || 'Falha de conexão com Firestore' };
  }
}

// Upload initial batch if Firestore is clean
export async function seedInitialFirestoreData(
  products: Product[],
  movements: StockMovement[],
  suppliers: Supplier[],
  employees?: Employee[],
  constructionSites?: ConstructionSite[],
  toolCautions?: ToolCaution[]
) {
  try {
    const prodCol = collection(db, 'products');
    const existingSnap = await getDocs(prodCol);
    if (existingSnap.empty && products.length > 0) {
      console.log('Seeding initial dataset to Firestore cloud...');
      const batch = writeBatch(db);
      products.forEach((p) => {
        const ref = doc(db, 'products', p.id);
        batch.set(ref, p);
      });
      suppliers.forEach((s) => {
        const ref = doc(db, 'suppliers', s.id);
        batch.set(ref, s);
      });
      movements.forEach((m) => {
        const ref = doc(db, 'movements', m.id);
        batch.set(ref, m);
      });
      if (employees && employees.length > 0) {
        employees.forEach((e) => {
          const ref = doc(db, 'employees', e.id);
          batch.set(ref, e);
        });
      }
      if (constructionSites && constructionSites.length > 0) {
        constructionSites.forEach((cs) => {
          const ref = doc(db, 'constructionSites', cs.id);
          batch.set(ref, cs);
        });
      }
      if (toolCautions && toolCautions.length > 0) {
        toolCautions.forEach((tc) => {
          const ref = doc(db, 'toolCautions', tc.id);
          batch.set(ref, tc);
        });
      }
      await batch.commit();
      console.log('Firestore seed complete for all collections!');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_batch');
  }
}

// Save single product to Firestore
export async function saveProductToFirestore(product: Product) {
  try {
    const ref = doc(db, 'products', product.id);
    await setDoc(ref, {
      ...product,
      _updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
  }
}

// Delete product from Firestore
export async function deleteProductFromFirestore(id: string) {
  try {
    const ref = doc(db, 'products', id);
    await setDoc(ref, { _deleted: true, _deletedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
  }
}

// Save single movement to Firestore
export async function saveMovementToFirestore(movement: StockMovement) {
  try {
    const ref = doc(db, 'movements', movement.id);
    await setDoc(ref, {
      ...movement,
      _syncedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `movements/${movement.id}`);
  }
}

// Delete movement from Firestore
export async function deleteMovementFromFirestore(id: string) {
  try {
    const ref = doc(db, 'movements', id);
    await setDoc(ref, { _deleted: true, _deletedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `movements/${id}`);
  }
}

// Save single supplier to Firestore
export async function saveSupplierToFirestore(supplier: Supplier) {
  try {
    const ref = doc(db, 'suppliers', supplier.id);
    await setDoc(ref, supplier, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `suppliers/${supplier.id}`);
  }
}

// Delete supplier from Firestore
export async function deleteSupplierFromFirestore(id: string) {
  try {
    const ref = doc(db, 'suppliers', id);
    await setDoc(ref, { _deleted: true, _deletedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `suppliers/${id}`);
  }
}

// Save single employee to Firestore
export async function saveEmployeeToFirestore(employee: Employee) {
  try {
    const ref = doc(db, 'employees', employee.id);
    await setDoc(ref, {
      ...employee,
      _updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `employees/${employee.id}`);
  }
}

// Delete employee from Firestore
export async function deleteEmployeeFromFirestore(id: string) {
  try {
    const ref = doc(db, 'employees', id);
    await setDoc(ref, { _deleted: true, _deletedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `employees/${id}`);
  }
}

// Save single construction site to Firestore
export async function saveConstructionSiteToFirestore(site: ConstructionSite) {
  try {
    const ref = doc(db, 'constructionSites', site.id);
    await setDoc(ref, {
      ...site,
      _updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `constructionSites/${site.id}`);
  }
}

// Delete construction site from Firestore
export async function deleteConstructionSiteFromFirestore(id: string) {
  try {
    const ref = doc(db, 'constructionSites', id);
    await setDoc(ref, { _deleted: true, _deletedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `constructionSites/${id}`);
  }
}

// Save single tool caution to Firestore
export async function saveToolCautionToFirestore(caution: ToolCaution) {
  try {
    const ref = doc(db, 'toolCautions', caution.id);
    await setDoc(ref, {
      ...caution,
      _updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `toolCautions/${caution.id}`);
  }
}

// Delete tool caution from Firestore
export async function deleteToolCautionFromFirestore(id: string) {
  try {
    const ref = doc(db, 'toolCautions', id);
    await setDoc(ref, { _deleted: true, _deletedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `toolCautions/${id}`);
  }
}

// Save App Settings to Firestore
export async function saveSettingsToFirestore(settings: AppSettings) {
  try {
    const ref = doc(db, 'settings', 'global_config');
    await setDoc(ref, {
      ...settings,
      _savedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/global_config');
  }
}

// Broadcast ALL data to Firestore & ping all connected devices
export async function broadcastAllDataToFirestore(payload: {
  products: Product[];
  movements: StockMovement[];
  suppliers: Supplier[];
  employees: Employee[];
  constructionSites: ConstructionSite[];
  toolCautions: ToolCaution[];
  settings: AppSettings;
  triggeredBy?: string;
}): Promise<{ success: boolean; totalItems: number; timestamp: string; message: string }> {
  try {
    const { products, movements, suppliers, employees, constructionSites, toolCautions, settings, triggeredBy } = payload;
    const nowIso = new Date().toISOString();

    // 1. Commit in chunked batches to respect Firestore 500 operations per batch limit
    const allOperations: { col: string; id: string; data: any }[] = [];

    products.forEach((p) => allOperations.push({ col: 'products', id: p.id, data: { ...p, _syncedAt: nowIso } }));
    movements.forEach((m) => allOperations.push({ col: 'movements', id: m.id, data: { ...m, _syncedAt: nowIso } }));
    suppliers.forEach((s) => allOperations.push({ col: 'suppliers', id: s.id, data: { ...s, _syncedAt: nowIso } }));
    employees.forEach((e) => allOperations.push({ col: 'employees', id: e.id, data: { ...e, _syncedAt: nowIso } }));
    constructionSites.forEach((cs) => allOperations.push({ col: 'constructionSites', id: cs.id, data: { ...cs, _syncedAt: nowIso } }));
    toolCautions.forEach((tc) => allOperations.push({ col: 'toolCautions', id: tc.id, data: { ...tc, _syncedAt: nowIso } }));

    // Chunk size 400
    const chunkSize = 400;
    for (let i = 0; i < allOperations.length; i += chunkSize) {
      const chunk = allOperations.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        const ref = doc(db, item.col, item.id);
        batch.set(ref, item.data, { merge: true });
      });
      await batch.commit();
    }

    // 2. Save settings
    const settingsRef = doc(db, 'settings', 'global_config');
    await setDoc(settingsRef, { ...settings, _lastBroadcastAt: nowIso, _savedAt: serverTimestamp() }, { merge: true });

    // 3. Write broadcast trigger signal for all connected devices
    const broadcastRef = doc(db, 'system_sync', 'broadcast_state');
    await setDoc(broadcastRef, {
      timestamp: nowIso,
      _serverTime: serverTimestamp(),
      triggeredBy: triggeredBy || 'Operador Central',
      summary: {
        products: products.length,
        movements: movements.length,
        suppliers: suppliers.length,
        employees: employees.length,
        constructionSites: constructionSites.length,
        toolCautions: toolCautions.length,
        totalItems: allOperations.length,
      },
      message: 'Base de dados atualizada e sincronizada com todos os dispositivos',
    });

    return {
      success: true,
      totalItems: allOperations.length,
      timestamp: nowIso,
      message: `Transmitido com sucesso! ${allOperations.length} registros sincronizados para todos os aparelhos.`,
    };
  } catch (err: any) {
    console.error('Error broadcasting data to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, 'broadcast_all_data');
    return {
      success: false,
      totalItems: 0,
      timestamp: new Date().toISOString(),
      message: err?.message || 'Erro ao sincronizar dados com o Firebase',
    };
  }
}
