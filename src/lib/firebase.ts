import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD-UhcwMMe0XBnYwoFTi5T63czISgRWrUM',
  authDomain: 'americas-travel.firebaseapp.com',
  projectId: 'americas-travel',
  storageBucket: 'americas-travel.firebasestorage.app',
  messagingSenderId: '99257755218',
  appId: '1:99257755218:web:fd0b5e6fcee7157e21e18b',
  measurementId: 'G-E5RXRRR4DW',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

declare global {
  var __americasTravelFirestore__: Firestore | undefined;
}

function createFirestoreInstance() {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
}

export const db = globalThis.__americasTravelFirestore__ ?? createFirestoreInstance();

if (!globalThis.__americasTravelFirestore__) {
  globalThis.__americasTravelFirestore__ = db;
}
