import { StyleSheet, Switch, View } from 'react-native';

import { GlassSurface } from '@/components/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/providers/theme-preference';

export function ThemeModeToggle() {
  const theme = useTheme();
  const { isTablet } = useDeviceLayout();
  const preferenceContext = useThemePreference();

  if (!preferenceContext) {
    return null;
  }

  const isDark = preferenceContext.preference === 'dark';

  return (
    <GlassSurface
      style={[
        styles.container,
        isTablet && styles.containerTablet,
        {
          borderColor: theme.border,
        },
      ]}
      variant="muted">
      <View style={styles.textWrap}>
        <ThemedText type="smallBold">Dark Mode</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Use the darker appearance across the app.
        </ThemedText>
      </View>

      <Switch
        value={isDark}
        onValueChange={(value) => preferenceContext.setPreference(value ? 'dark' : 'light')}
        trackColor={{ false: theme.backgroundElement, true: theme.tint }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.backgroundElement}
        style={isTablet ? styles.switchTablet : undefined}
      />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  containerTablet: {
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  switchTablet: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
});
