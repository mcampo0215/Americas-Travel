import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Persistence } from 'firebase/auth';

import './firebase';

const { getAuth, initializeAuth, getReactNativePersistence } = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

function createAuth() {
  try {
    return initializeAuth(getApp(), { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'auth/already-initialized') {
      return getAuth(getApp());
    }
    throw error;
  }
}

export const auth = createAuth();