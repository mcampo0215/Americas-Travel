import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

function LayoutContent() {
  const colorScheme = useColorScheme();
  const { ready, user, onboarded } = useAuthSession();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {!ready ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Restoring session" /></View> : !user || !onboarded ? <WelcomeFlow /> : (
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
  return (
    <ThemePreferenceProvider>
      <AuthSessionProvider>
        <LayoutContent />
      </AuthSessionProvider>
    </ThemePreferenceProvider>
  );
}
