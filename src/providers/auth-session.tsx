import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { auth } from '@/lib/auth';

type AuthSession = {
  user: User | null;
  ready: boolean;
  onboarded: boolean;
  completeOnboarding: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthSession | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setOnboarded(Boolean(nextUser));
    setAuthReady(true);
  }), []);

  async function completeOnboarding() {
    setOnboarded(true);
  }

  return (
    <AuthContext.Provider value={{
      user,
      ready: authReady,
      onboarded,
      completeOnboarding,
      logOut: () => signOut(auth),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthSession() {
  const session = useContext(AuthContext);
  if (!session) throw new Error('useAuthSession requires AuthSessionProvider');
  return session;
}
