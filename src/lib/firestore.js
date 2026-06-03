import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const packagesRef = collection(db, 'packages');
const bookingsRef = collection(db, 'bookings');

function omitUndefinedFields(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

function logSnapshotError(label, error) {
  console.error(`Firestore ${label} subscription error:`, error);
}

export function subscribeToPackages(callback) {
  const q = query(packagesRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      callback(items);
    },
    (error) => logSnapshotError('packages', error)
  );
}

export async function createPackage(data) {
  await addDoc(packagesRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePackage(id, data) {
  const ref = doc(db, 'packages', id);

  const { createdAt, ...rest } = data;

  await updateDoc(ref, {
    ...omitUndefinedFields(rest),
    updatedAt: serverTimestamp(),
  });
}

export async function removePackage(id) {
  const ref = doc(db, 'packages', id);
  await deleteDoc(ref);
}

export function subscribeToBookings(callback) {
  const q = query(bookingsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      callback(items);
    },
    (error) => logSnapshotError('bookings', error)
  );
}

export async function createBooking(data) {
  await addDoc(bookingsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateBooking(id, data) {
  const ref = doc(db, 'bookings', id);

  const { createdAt, ...rest } = data;

  await updateDoc(ref, {
    ...omitUndefinedFields(rest),
    updatedAt: serverTimestamp(),
  });
}

export async function removeBooking(id) {
  const ref = doc(db, 'bookings', id);
  await deleteDoc(ref);
}
