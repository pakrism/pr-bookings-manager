import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export async function listUsers() {
  const callable = httpsCallable(functions, 'listUsers');
  const result = await callable();
  return result.data || [];
}

export async function createUser(payload) {
  const callable = httpsCallable(functions, 'createUser');
  const result = await callable(payload);
  return result.data;
}

export async function updateUser(payload) {
  const callable = httpsCallable(functions, 'updateUser');
  const result = await callable(payload);
  return result.data;
}

export async function resetUserPassword(email) {
  const callable = httpsCallable(functions, 'resetUserPassword');
  const result = await callable({ email });
  return result.data;
}
