import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { Platform, View, type ViewProps } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type GlassSurfaceProps = ViewProps & {
  variant?: 'default' | 'muted' | 'elevated';
};

export function GlassSurface({
  style,
  children,
  variant = 'default',
  ...rest
}: GlassSurfaceProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const canUseNativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

  const fallbackBackgroundColor =
    variant === 'muted'
      ? theme.surfaceMuted
      : variant === 'elevated'
        ? theme.surfaceElevated
        : theme.surface;

  const tintColor =
    variant === 'muted'
      ? theme.glassTintMuted
      : variant === 'elevated'
        ? theme.glassTint
        : theme.glassTint;

  if (canUseNativeGlass) {
    return (
      <View {...rest} style={style}>
        <GlassView
          pointerEvents="none"
          colorScheme={colorScheme}
          glassEffectStyle="regular"
          tintColor={tintColor}
          style={glassFillStyle}
        />
        {children}
      </View>
    );
  }

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: fallbackBackgroundColor,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const glassFillStyle = {
  position: 'absolute' as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
