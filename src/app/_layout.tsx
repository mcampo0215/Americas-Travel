import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppLoadingScreen } from '@/components/app-loading-screen';
import AppTabs from '@/components/app-tabs';
import { SaleMilestoneCelebration } from '@/components/sale-milestone-celebration';
import { WelcomeFlow } from '@/components/welcome-flow';
import { AuthSessionProvider, useAuthSession } from '@/providers/auth-session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { InventoryStoreProvider } from '@/providers/inventory-store';
import { ThemePreferenceProvider } from '@/providers/theme-preference';
import { resolveAuthDestination } from '@/utils/auth-routing';

void SplashScreen.preventAutoHideAsync();

function LayoutContent() {
  const colorScheme = useColorScheme();
  const { ready, user } = useAuthSession();
  const authDestination = resolveAuthDestination(ready, Boolean(user));

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {authDestination === 'loading' ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Restoring session" /></View> : authDestination === 'signed-out' ? <WelcomeFlow /> : (
            <InventoryStoreProvider>
              <AppTabs />
              <SaleMilestoneCelebration />
              <AppLoadingScreen />
            </InventoryStoreProvider>
          )}
        </View>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

export default function TabLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemePreferenceProvider>
      <AuthSessionProvider>
        <LayoutContent />
      </AuthSessionProvider>
    </ThemePreferenceProvider>
  );
}
