import { deleteApp, getApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, initializeAuth, inMemoryPersistence, signOut, updateProfile } from 'firebase/auth';

import './firebase';

// Firebase signs in newly created users. Isolate that temporary session so the
// app's persisted session stays signed out until the user explicitly logs in.
export async function registerAccount(email: string, password: string, displayName: string) {
  const registrationApp = initializeApp(getApp().options, `registration-${Date.now()}`);
  try {
    const registrationAuth = initializeAuth(registrationApp, { persistence: inMemoryPersistence });
    try {
      const credential = await createUserWithEmailAndPassword(registrationAuth, email, password);
      await updateProfile(credential.user, { displayName });
    } finally {
      await signOut(registrationAuth);
    }
  } finally {
    await deleteApp(registrationApp);
  }
}
