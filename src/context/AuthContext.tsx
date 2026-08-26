import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
} from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName: string,
    role?: 'ADMIN' | 'ALMOXARIFE' | 'OPERADOR' | 'AUDITOR',
    department?: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to translate Firebase Auth errors into user-friendly Portuguese messages
export function translateFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'O formato do e-mail informado é inválido.';
    case 'auth/user-disabled':
      return 'Esta conta de usuário foi desativada pelo administrador.';
    case 'auth/user-not-found':
      return 'Nenhuma conta cadastrada com este e-mail.';
    case 'auth/wrong-password':
      return 'Senha incorreta. Por favor, tente novamente.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso por outro colaborador.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Utilize no mínimo 6 caracteres.';
    case 'auth/operation-not-allowed':
      return 'O provedor de autenticação E-mail/Senha precisa estar habilitado no Console Firebase.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas com falha. Aguarde alguns instantes e tente novamente.';
    case 'auth/network-request-failed':
      return 'Erro de conexão com o Firebase. Verifique sua conexão com a internet.';
    case 'auth/popup-closed-by-user':
      return 'Janela de autenticação fechada antes da conclusão.';
    default:
      return 'Ocorreu um erro na autenticação. Verifique os dados e tente novamente.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Sync profile document from Firestore
  const fetchUserProfile = async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
      } else {
        // Create initial default profile if not exists yet
        const defaultProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Almoxarife',
          role: user.email?.includes('admin') ? 'ADMIN' : 'ALMOXARIFE',
          department: 'Almoxarifado Geral',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        await setDoc(userDocRef, {
          ...defaultProfile,
          _updatedAt: serverTimestamp(),
        }, { merge: true });

        setUserProfile(defaultProfile);
      }
    } catch (err) {
      console.warn('Error loading user profile from Firestore:', err);
      // Fallback local profile
      setUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Operador',
        role: 'ALMOXARIFE',
        department: 'Almoxarifado Central',
        createdAt: new Date().toISOString(),
      });
    }
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Sign In with Email & Password
  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user) {
        await fetchUserProfile(cred.user);
      }
      setLoading(false);
      return true;
    } catch (err: any) {
      const msg = translateFirebaseAuthError(err?.code || '');
      setAuthError(msg);
      setLoading(false);
      return false;
    }
  };

  // 2. Register New User with Email & Password
  const registerWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: 'ADMIN' | 'ALMOXARIFE' | 'OPERADOR' | 'AUDITOR' = 'ALMOXARIFE',
    department: string = 'Almoxarifado'
  ): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user) {
        // Update display name on auth user
        await updateProfile(cred.user, { displayName: displayName.trim() });

        // Save detailed profile to Firestore
        const profileData: UserProfile = {
          uid: cred.user.uid,
          email: cred.user.email || email.trim(),
          displayName: displayName.trim(),
          role,
          department: department.trim(),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        const userDocRef = doc(db, 'users', cred.user.uid);
        await setDoc(userDocRef, {
          ...profileData,
          _createdAt: serverTimestamp(),
        });

        setUserProfile(profileData);
      }
      setLoading(false);
      return true;
    } catch (err: any) {
      const msg = translateFirebaseAuthError(err?.code || '');
      setAuthError(msg);
      setLoading(false);
      return false;
    }
  };

  // 3. Logout
  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Send Password Reset
  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err: any) {
      const msg = translateFirebaseAuthError(err?.code || '');
      setAuthError(msg);
      return false;
    }
  };

  // 5. Update Profile Data
  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    try {
      const updated = { ...userProfile, ...data };
      setUserProfile(updated);
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        ...updated,
        _updatedAt: serverTimestamp(),
      }, { merge: true });

      if (data.displayName && data.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: data.displayName });
      }
    } catch (err) {
      console.error('Update profile error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        authError,
        clearAuthError,
        loginWithEmail,
        registerWithEmail,
        logout,
        sendPasswordReset,
        updateUserProfileData,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
