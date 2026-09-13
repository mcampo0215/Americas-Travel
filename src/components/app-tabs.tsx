import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';

import { Colors } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const { isTablet } = useDeviceLayout();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const canUseNativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: isTablet ? 14 : 11,
          fontWeight: '600',
          marginTop: isTablet ? 6 : 4,
          marginBottom: isTablet ? 2 : 0,
        },
        tabBarItemStyle: {
          paddingVertical: isTablet ? 8 : 6,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: isTablet ? 92 : 76,
          paddingTop: isTablet ? 10 : 8,
          paddingBottom: isTablet ? 12 : 10,
          position: 'absolute',
        },
        tabBarBackground: () =>
          canUseNativeGlass ? (
            <GlassView
              style={StyleSheet.absoluteFill}
              colorScheme={scheme === 'dark' ? 'dark' : 'light'}
              glassEffectStyle="regular"
              tintColor={colors.glassTint}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.surfaceElevated,
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
