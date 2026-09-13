import { useColorScheme as useNativeColorScheme } from 'react-native';

import { useThemePreference } from '@/providers/theme-preference';

export function useColorScheme() {
  const preferenceContext = useThemePreference();
  const nativeColorScheme = useNativeColorScheme();

  if (preferenceContext) {
    return preferenceContext.resolvedScheme;
  }

  return nativeColorScheme;
}
