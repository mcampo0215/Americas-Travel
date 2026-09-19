import { useEffect, useState } from 'react';
import { usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useTheme } from '@/hooks/use-theme';

export type InsightsChartPoint = {
  id: string;
  label: string;
  value: number;
  detail: string;
};

export function AnimatedInsightsChart({ data, label, currency = false }: {
  data: InsightsChartPoint[];
  label: string;
  currency?: boolean;
}) {
  const theme = useTheme();
  const { fontScale, isTablet } = useDeviceLayout();
  const plotHeight = isTablet ? 300 : 240;
  const active = usePathname() === '/explore';
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data.find((point) => point.id === selectedId) ?? data[0];
  const maximum = Math.max(1, ...data.map((point) => point.value));

  return (
    <View style={styles.chart}>
      <View style={styles.readout} accessibilityLiveRegion="polite">
        <ThemedText type="smallBold" style={styles.selectionName} numberOfLines={2}>
          {selected?.label ?? 'No sales yet'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.detail} numberOfLines={2}>
          {selected ? `${currency ? `$${selected.value.toFixed(2)}` : `${selected.value} sold`} · ${selected.detail}` : label}
        </ThemedText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.scrollContent}>
        <View style={styles.plot}>
          {[0, 0.5, 1].map((fraction) => (
            <View key={fraction} pointerEvents="none" style={[styles.guide, { top: 34 * fontScale + fraction * plotHeight, borderColor: theme.textMuted }]} />
          ))}
          {data.length === 0 ? <View style={[styles.emptyPlot, { height: plotHeight + 110 * fontScale }]} /> : data.map((point, index) => (
            <ChartBar
              key={point.id}
              point={point}
              index={index}
              height={Math.max(0, point.value / maximum * plotHeight)}
              plotHeight={plotHeight}
              selected={point.id === selected?.id}
              active={active}
              currency={currency}
              onSelect={() => setSelectedId(point.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ChartBar({ point, index, height, plotHeight, selected, active, currency, onSelect }: {
  point: InsightsChartPoint;
  index: number;
  height: number;
  plotHeight: number;
  selected: boolean;
  active: boolean;
  currency: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const { fontScale, isTablet } = useDeviceLayout();
  const slotWidth = (isTablet ? 120 : 96) * Math.max(1, fontScale);
  const reducedMotion = useReducedMotion();
  const animatedHeight = useSharedValue(reducedMotion ? height : 0);

  useEffect(() => {
    cancelAnimation(animatedHeight);
    if (!active) {
      animatedHeight.value = 0;
    } else if (reducedMotion) {
      animatedHeight.value = height;
    } else {
      animatedHeight.value = withDelay(index * 65, withTiming(height, { duration: 650, easing: Easing.out(Easing.cubic) }));
    }
    return () => cancelAnimation(animatedHeight);
  }, [active, animatedHeight, height, index, reducedMotion]);

  const barStyle = useAnimatedStyle(() => ({ height: animatedHeight.value }));
  const formatted = currency ? `$${point.value.toFixed(2)}` : `${point.value} sold`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${point.label}: ${formatted}. ${point.detail}`}
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={({ pressed }) => [styles.slot, { minWidth: slotWidth, opacity: pressed ? 0.75 : 1 }]}>
      <ThemedText type="smallBold" style={[styles.value, { height: 34 * fontScale, maxWidth: slotWidth, fontSize: isTablet ? 18 : 16, color: selected ? theme.text : theme.textSecondary }]} numberOfLines={1}>
        {currency ? `$${point.value.toFixed(0)}` : point.value}
      </ThemedText>
      <View style={[styles.barTrack, { height: plotHeight }]}>
        <Animated.View testID="insights-chart-bar" style={[
          styles.bar,
          { width: isTablet ? 52 : 40, backgroundColor: selected ? theme.tint : theme.success },
          barStyle,
        ]} />
      </View>
      <ThemedText type="small" style={[styles.label, { height: 56 * fontScale, width: slotWidth, fontSize: isTablet ? 17 : 15, color: selected ? theme.text : theme.textSecondary }]} numberOfLines={2}>
        {point.label}
      </ThemedText>
      <View style={[styles.selectionMark, { backgroundColor: selected ? theme.tint : 'transparent' }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chart: { gap: 16 },
  readout: { minHeight: 94, gap: 6, justifyContent: 'center' },
  selectionName: { fontSize: 20, lineHeight: 28 },
  detail: { fontSize: 15, lineHeight: 22, fontVariant: ['tabular-nums'] },
  scrollContent: { flexGrow: 1 },
  plot: { flex: 1, flexDirection: 'row', gap: 16, position: 'relative' },
  guide: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, opacity: 0.35 },
  emptyPlot: { width: '100%' },
  slot: { flex: 1, alignItems: 'center' },
  value: { lineHeight: 26, fontVariant: ['tabular-nums'] },
  barTrack: { justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  bar: { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  label: { marginTop: 14, lineHeight: 24, textAlign: 'center' },
  selectionMark: { width: 14, height: 3, borderRadius: 2, marginTop: 3 },
});