import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export async function listPoolExpenses() {
  const callable = httpsCallable(functions, 'listPoolExpenses');
  const result = await callable();
  return result.data || [];
}

export async function createPoolExpense(payload) {
  const callable = httpsCallable(functions, 'createPoolExpense');
  const result = await callable(payload);
  return result.data;
}

export async function updatePoolExpense(id, payload) {
  const callable = httpsCallable(functions, 'updatePoolExpense');
  const result = await callable({ id, ...payload });
  return result.data;
}

export async function deletePoolExpense(id) {
  const callable = httpsCallable(functions, 'deletePoolExpense');
  const result = await callable({ id });
  return result.data;
}
