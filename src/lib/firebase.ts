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
import { Product, StockMovement, Supplier, AppSettings, Employee } from '../types';

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
  suppliers: Supplier[]
) {
  try {
    const prodCol = collection(db, 'products');
    const existingSnap = await getDocs(prodCol);
    if (existingSnap.empty && products.length > 0) {
      console.log('Seeding initial products to Firestore...');
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
      await batch.commit();
      console.log('Firestore seed complete!');
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

// Save single supplier to Firestore
export async function saveSupplierToFirestore(supplier: Supplier) {
  try {
    const ref = doc(db, 'suppliers', supplier.id);
    await setDoc(ref, supplier, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `suppliers/${supplier.id}`);
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
