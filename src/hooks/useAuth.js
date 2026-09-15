import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { migrateLocalStorageToFirestore } from '../firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await migrateLocalStorageToFirestore(result.user.uid);
      return result.user;
    } catch (e) {
      setError(mapAuthError(e.code));
      throw e;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      await migrateLocalStorageToFirestore(result.user.uid);
      return result.user;
    } catch (e) {
      setError(mapAuthError(e.code));
      throw e;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await migrateLocalStorageToFirestore(result.user.uid);
      return result.user;
    } catch (e) {
      setError(mapAuthError(e.code));
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  }, []);

  return { user, loading, error, signInWithEmail, signUpWithEmail, signInWithGoogle, logout };
}

function mapAuthError(code) {
  switch (code) {
    case 'auth/user-not-found': return 'No existe una cuenta con este email';
    case 'auth/wrong-password': return 'Contraseña incorrecta';
    case 'auth/email-already-in-use': return 'Este email ya está registrado';
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/invalid-email': return 'Email no válido';
    case 'auth/popup-closed-by-user': return 'Popup de Google cerrado';
    case 'auth/cancelled-popup-request': return 'Operación cancelada';
    default: return 'Error de autenticación';
  }
}
