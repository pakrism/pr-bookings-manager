import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';

export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/** Session profile from Firebase Auth only (no Firestore users doc). */
export function buildSessionProfile(firebaseUser) {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    fullName:
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'User',
    role: 'admin',
    isActive: true,
  };
}
