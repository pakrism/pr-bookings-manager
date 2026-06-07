const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

const VALID_ROLES = new Set(['admin', 'booking_manager', 'viewer']);
const MANAGER_BOOKED_BY = new Set(['Zohaib', 'Pervaiz']);
const MANAGER_POOL_IDS = new Set(['zohaib', 'pervaiz']);

async function assertAdmin(context) {
  if (!context.auth?.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const callerDoc = await db.doc(`users/${context.auth.uid}`).get();
  const role = callerDoc.data()?.role;

  if (!callerDoc.exists || callerDoc.data()?.isActive !== true) {
    throw new HttpsError('permission-denied', 'Your account is not active.');
  }

  if (role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can manage users.');
  }
}

function sanitizeUserPayload(data, { partial = false } = {}) {
  const payload = {};

  if (!partial || data.fullName !== undefined) {
    payload.fullName = String(data.fullName || '').trim();
  }

  if (!partial || data.role !== undefined) {
    const role = String(data.role || 'viewer');
    if (!VALID_ROLES.has(role)) {
      throw new HttpsError('invalid-argument', 'Invalid role.');
    }
    payload.role = role;
  }

  if (!partial || data.isActive !== undefined) {
    payload.isActive = data.isActive !== false;
  }

  const role = payload.role ?? data.role;

  if (role === 'booking_manager') {
    const bookedBy = String(data.bookedBy || '').trim();
    const poolId = String(data.poolId || '').trim();

    if (!MANAGER_BOOKED_BY.has(bookedBy)) {
      throw new HttpsError('invalid-argument', 'Booking managers need bookedBy set to Zohaib or Pervaiz.');
    }

    if (!MANAGER_POOL_IDS.has(poolId)) {
      throw new HttpsError('invalid-argument', 'Booking managers need poolId set to zohaib or pervaiz.');
    }

    payload.bookedBy = bookedBy;
    payload.poolId = poolId;
  } else if (!partial) {
    payload.bookedBy = admin.firestore.FieldValue.delete();
    payload.poolId = admin.firestore.FieldValue.delete();
  } else if (role && role !== 'booking_manager') {
    payload.bookedBy = admin.firestore.FieldValue.delete();
    payload.poolId = admin.firestore.FieldValue.delete();
  }

  return payload;
}

exports.listUsers = onCall(async (request) => {
  await assertAdmin(request);

  const snapshot = await db.collection('users').get();
  return snapshot.docs
    .map((docSnap) => ({
      uid: docSnap.id,
      ...docSnap.data(),
    }))
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')));
});

exports.createUser = onCall(async (request) => {
  await assertAdmin(request);

  const { email, password, sendPasswordReset } = request.data || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new HttpsError('invalid-argument', 'Email is required.');
  }

  if (!sendPasswordReset && (!password || String(password).length < 6)) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.');
  }

  const profile = sanitizeUserPayload(request.data || {});

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: normalizedEmail,
      password: sendPasswordReset ? undefined : String(password),
      displayName: profile.fullName || normalizedEmail,
      disabled: profile.isActive === false,
    });
  } catch (error) {
    throw new HttpsError('already-exists', error.message || 'Could not create auth user.');
  }

  await db.doc(`users/${userRecord.uid}`).set({
    email: normalizedEmail,
    fullName: profile.fullName || '',
    role: profile.role || 'viewer',
    isActive: profile.isActive !== false,
    ...(profile.role === 'booking_manager'
      ? { bookedBy: profile.bookedBy, poolId: profile.poolId }
      : {}),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (sendPasswordReset) {
    const resetLink = await auth.generatePasswordResetLink(normalizedEmail);
    return { uid: userRecord.uid, email: normalizedEmail, resetLink };
  }

  return { uid: userRecord.uid, email: normalizedEmail };
});

exports.updateUser = onCall(async (request) => {
  await assertAdmin(request);

  const { uid } = request.data || {};
  if (!uid) {
    throw new HttpsError('invalid-argument', 'User id is required.');
  }

  const existing = await db.doc(`users/${uid}`).get();
  if (!existing.exists) {
    throw new HttpsError('not-found', 'User not found.');
  }

  const mergedRole = request.data.role ?? existing.data()?.role;
  const profile = sanitizeUserPayload(
    { ...existing.data(), ...request.data, role: mergedRole },
    { partial: true }
  );

  await db.doc(`users/${uid}`).set(
    {
      ...profile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (request.data.isActive === false) {
    await auth.updateUser(uid, { disabled: true });
  } else if (request.data.isActive === true) {
    await auth.updateUser(uid, { disabled: false });
  }

  if (request.data.fullName) {
    await auth.updateUser(uid, { displayName: String(request.data.fullName).trim() });
  }

  return { uid };
});

exports.resetUserPassword = onCall(async (request) => {
  await assertAdmin(request);

  const email = String(request.data?.email || '').trim().toLowerCase();
  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required.');
  }

  const resetLink = await auth.generatePasswordResetLink(email);
  return { resetLink };
});
