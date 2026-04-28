import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
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

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
]);

function describeAuthError(error: unknown): string {
  const code = (error as AuthError | undefined)?.code;
  const message = error instanceof Error ? error.message : String(error);
  switch (code) {
    case 'auth/unauthorized-domain':
      return `Este dominio no está autorizado en Firebase Authentication. Añádelo en Firebase Console → Authentication → Settings → Authorized domains.`;
    case 'auth/popup-blocked':
      return 'El navegador bloqueó el popup de Google. Permite popups o reintenta (se intentará redirección automática).';
    case 'auth/popup-closed-by-user':
      return 'Cerraste el popup antes de completar el login.';
    case 'auth/network-request-failed':
      return 'Error de red al contactar Firebase. Revisa la conexión.';
    case 'auth/internal-error':
      return 'Error interno de Firebase Auth. Verifica que Google esté habilitado como proveedor.';
    default:
      return code ? `${code}: ${message}` : message;
  }
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect login failed', error);
      setAuthError(describeAuthError(error));
    });

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const userSnap = await getDoc(userRef);

          const userData = {
            displayName: u.displayName,
            email: u.email,
            photoURL: u.photoURL,
            lastLogin: serverTimestamp(),
          };

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              ...userData,
              createdAt: serverTimestamp(),
            });
          } else {
            await setDoc(userRef, userData, { merge: true });
          }
        } catch (error) {
          console.error('Failed to sync user profile', error);
        }
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const code = (error as AuthError | undefined)?.code;
      console.error('Login failed', error);

      if (code && POPUP_FALLBACK_CODES.has(code)) {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error('Redirect login failed', redirectError);
          setAuthError(describeAuthError(redirectError));
          return;
        }
      }

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
