import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const { isTablet, fontScale } = useDeviceLayout();
  const insets = useSafeAreaInsets();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const isDark = scheme === 'dark';
  const canUseNativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && !isDark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: isTablet ? 16 : 13,
          fontWeight: '600',
          marginTop: isTablet ? 6 : 4,
          marginBottom: isTablet ? 2 : 0,
        },
        tabBarItemStyle: {
          paddingVertical: isTablet ? 8 : 6,
        },
        tabBarStyle: {
          backgroundColor: isDark ? colors.background : 'transparent',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: (isTablet ? 86 : 70) + Math.max(insets.bottom, 10) + Math.max(0, fontScale - 1) * 20,
          paddingTop: isTablet ? 10 : 8,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        tabBarBackground: () =>
          canUseNativeGlass ? (
            <GlassView
              style={StyleSheet.absoluteFill}
              colorScheme="light"
              glassEffectStyle="regular"
              tintColor={colors.glassTint}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark ? colors.background : colors.surfaceElevated,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                },
              ]}
            />
          ),
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color }) => (
            Platform.OS === 'ios' ? (
              <SymbolView name="shippingbox.fill" size={isTablet ? 28 : 22} tintColor={color} />
            ) : (
              <Text style={{ fontSize: isTablet ? 28 : 20, color }}>□</Text>
            )
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            Platform.OS === 'ios' ? (
              <SymbolView name="chart.bar.fill" size={isTablet ? 28 : 22} tintColor={color} />
            ) : (
              <Text style={{ fontSize: isTablet ? 28 : 20, color }}>▤</Text>
            )
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <SymbolView name="gearshape.fill" size={isTablet ? 30 : 22} tintColor={color} />
            ) : (
              <Text style={{ fontSize: isTablet ? 28 : 20, color }}>⚙</Text>
            ),
        }}
      />
    </Tabs>
  );
}
