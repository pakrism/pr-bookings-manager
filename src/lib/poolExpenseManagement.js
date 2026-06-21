import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

function logPoolExpenseEvent(message, data, hypothesisId = 'H6') {
  // #region agent log
  fetch('http://127.0.0.1:7697/ingest/1d929821-d065-42ff-8f6e-0c95ee0b2075', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '678e05' },
    body: JSON.stringify({
      sessionId: '678e05',
      location: 'poolExpenseManagement.js',
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId: 'post-fix',
    }),
  }).catch(() => {});
  // #endregion
}

export async function listPoolExpenses() {
  const callable = httpsCallable(functions, 'listPoolExpenses');
  try {
    const result = await callable();
    const items = result.data || [];
    logPoolExpenseEvent('listPoolExpenses success', { count: items.length });
    return items;
  } catch (error) {
    console.error('[poolExpenses] listPoolExpenses failed', error?.code, error?.message);
    logPoolExpenseEvent('listPoolExpenses failed', {
      code: error?.code,
      message: error?.message,
    });
    throw error;
  }
}

export async function createPoolExpense(payload) {
  const callable = httpsCallable(functions, 'createPoolExpense');
  logPoolExpenseEvent('createPoolExpense attempt', {
    expenseDate: payload?.expenseDate,
    amount: payload?.amount,
  });
  try {
    const result = await callable(payload);
    logPoolExpenseEvent('createPoolExpense success', { id: result.data?.id });
    return result.data;
  } catch (error) {
    console.error('[poolExpenses] createPoolExpense failed', error?.code, error?.message);
    logPoolExpenseEvent('createPoolExpense failed', {
      code: error?.code,
      message: error?.message,
    });
    throw error;
  }
}

export async function updatePoolExpense(id, payload) {
  const callable = httpsCallable(functions, 'updatePoolExpense');
  try {
    const result = await callable({ id, ...payload });
    logPoolExpenseEvent('updatePoolExpense success', { id });
    return result.data;
  } catch (error) {
    logPoolExpenseEvent('updatePoolExpense failed', {
      code: error?.code,
      message: error?.message,
    });
    throw error;
  }
}

export async function deletePoolExpense(id) {
  const callable = httpsCallable(functions, 'deletePoolExpense');
  try {
    const result = await callable({ id });
    logPoolExpenseEvent('deletePoolExpense success', { id });
    return result.data;
  } catch (error) {
    logPoolExpenseEvent('deletePoolExpense failed', {
      code: error?.code,
      message: error?.message,
    });
    throw error;
  }
}
