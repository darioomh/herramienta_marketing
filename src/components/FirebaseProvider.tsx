import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  AuthError,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function describeAuthError(error: unknown): string {
  const code = (error as AuthError | undefined)?.code;
  const message = error instanceof Error ? error.message : String(error);
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Este dominio no está autorizado en Firebase Authentication. Añádelo en Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/network-request-failed':
      return 'Error de red al contactar Firebase. Revisa la conexión.';
    case 'auth/internal-error':
      return 'Error interno de Firebase Auth. Verifica que Google esté habilitado como proveedor.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in no está habilitado en Firebase. Actívalo en Authentication → Sign-in method.';
    default:
      return code ? `${code}: ${message}` : message;
  }
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        console.log('[auth] getRedirectResult', result ? `user=${result.user.uid}` : 'no pending redirect');
      })
      .catch((error) => {
        console.error('[auth] Redirect login failed', error);
        setAuthError(describeAuthError(error));
      });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log('[auth] onAuthStateChanged', u ? `signed in as ${u.email} (${u.uid})` : 'signed out');
      setUser(u);
      setLoading(false);

      if (u) {
        void syncUserProfile(u);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncUserProfile = async (u: User) => {
    try {
      const userRef = doc(db, 'users', u.uid);
      const userSnap = await getDoc(userRef);

      const updatableFields = {
        displayName: u.displayName,
        photoURL: u.photoURL,
        lastLogin: serverTimestamp(),
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          ...updatableFields,
          email: u.email,
          createdAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, updatableFields, { merge: true });
      }
    } catch (error) {
      console.error('[auth] Failed to sync user profile', error);
    }
  };

  const login = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
      setAuthError(describeAuthError(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};
