import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

export type ThemePreference = 'light' | 'dark';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedScheme: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  togglePreference: () => void;
};

const STORAGE_KEY = 'theme-preference-v1';
let storageAvailable = true;

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

async function safeGetStoredPreference() {
  if (!storageAvailable) {
    return null;
  }

  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    storageAvailable = false;
    return null;
  }
}

async function safeSetStoredPreference(preference: ThemePreference) {
  if (!storageAvailable) {
    return;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, preference);
  } catch {
    storageAvailable = false;
  }
}

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const systemScheme = useNativeColorScheme();
  const defaultScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>(defaultScheme);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const storedPreference = await safeGetStoredPreference();

      if (!isMounted) {
        return;
      }

      if (storedPreference) {
        setPreferenceState(storedPreference);
      }

      setHasHydrated(true);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setPreference = (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    void safeSetStoredPreference(nextPreference);
  };

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      preference,
      resolvedScheme: preference,
      setPreference,
      togglePreference: () => {
        const nextPreference = preference === 'dark' ? 'light' : 'dark';
        setPreference(nextPreference);
      },
    }),
    [preference]
  );

  if (!hasHydrated) {
    return null;
  }

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  return useContext(ThemePreferenceContext);
}
