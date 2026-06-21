import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyBwCinf-tWNQs_otlU_v7-DKyim32ycBqc',
  authDomain: 'pakrism-bookings.firebaseapp.com',
  databaseURL:
    'https://pakrism-bookings-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'pakrism-bookings',
  storageBucket: 'pakrism-bookings.firebasestorage.app',
  messagingSenderId: '709553104809',
  appId: '1:709553104809:web:fbe0ce31d725ec4795c6b8',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');
