import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import type { TextStyle } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    | 'eyebrow'
    | 'sectionTitle';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { isTablet } = useDeviceLayout();
  const typeStyle = getTypeStyle(type, isTablet);
  const resolvedStyle = StyleSheet.flatten([typeStyle, style]);
  const fontFamily = type === 'code' || resolvedStyle.fontFamily === Fonts.mono
    ? Fonts.mono
    : getSansFont(resolvedStyle.fontWeight);
  // Apply the readability increase after screen-specific overrides as well.
  const readableSize: TextStyle = {
    fontSize: typeof resolvedStyle.fontSize === 'number'
      ? Math.round(resolvedStyle.fontSize * 1.12)
      : undefined,
    lineHeight: typeof resolvedStyle.lineHeight === 'number'
      ? Math.ceil(resolvedStyle.lineHeight * 1.12)
      : undefined,
  };

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'], flexShrink: 1 },
        typeStyle,
        style,
        { fontFamily },
        readableSize,
      ]}
      {...rest}
    />
  );
}

function getSansFont(fontWeight: TextStyle['fontWeight']) {
  const numericWeight = typeof fontWeight === 'string' ? Number.parseInt(fontWeight, 10) : fontWeight;

  if (fontWeight === 'bold' || (typeof numericWeight === 'number' && numericWeight >= 800)) {
    return Fonts.sansExtraBold;
  }

  if (typeof numericWeight === 'number' && numericWeight >= 700) {
    return Fonts.sansBold;
  }

  if (typeof numericWeight === 'number' && numericWeight >= 600) {
    return Fonts.sansSemiBold;
  }

  return Fonts.sans;
}

function getTypeStyle(type: NonNullable<ThemedTextProps['type']>, isTablet: boolean) {
  const baseStyle = (styles[type] ?? styles.default) as TextStyle;

  if (!isTablet) {
    return baseStyle;
  }

  const scaleByType: Record<NonNullable<ThemedTextProps['type']>, number> = {
    default: 1.38,
    title: 1.42,
    small: 1.48,
    smallBold: 1.48,
    subtitle: 1.36,
    link: 1.34,
    linkPrimary: 1.34,
    code: 1.24,
    eyebrow: 1.28,
    sectionTitle: 1.4,
  };
  const scale = scaleByType[type];
  const tabletStyle: TextStyle = { ...baseStyle };

  if (typeof baseStyle.fontSize === 'number') {
    tabletStyle.fontSize = Math.round(baseStyle.fontSize * scale);
  }

  if (typeof baseStyle.lineHeight === 'number') {
    tabletStyle.lineHeight = Math.round(baseStyle.lineHeight * scale);
  }

  return tabletStyle;
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: 500,
    fontFamily: Fonts.sans,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: 700,
    fontFamily: Fonts.sansBold,
  },
  default: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: 500,
    fontFamily: Fonts.sans,
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    lineHeight: 40,
    letterSpacing: -0.9,
    fontFamily: Fonts.sansExtraBold,
  },
  subtitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: 800,
    letterSpacing: -0.5,
    fontFamily: Fonts.sansExtraBold,
  },
  link: {
    lineHeight: 22,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: Fonts.sansSemiBold,
  },
  linkPrimary: {
    lineHeight: 22,
    fontSize: 14,
    color: '#3c87f7',
    fontWeight: 700,
    fontFamily: Fonts.sansBold,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: 800,
    letterSpacing: -0.3,
    fontFamily: Fonts.sansExtraBold,
  },
});
