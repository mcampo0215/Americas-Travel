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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.plot}>
          {[0, 0.5, 1].map((fraction) => (
            <View key={fraction} pointerEvents="none" style={[styles.guide, { top: 26 + fraction * 132, borderColor: theme.textMuted }]} />
          ))}
          {data.length === 0 ? <View style={styles.emptyPlot} /> : data.map((point, index) => (
            <ChartBar
              key={point.id}
              point={point}
              index={index}
              height={Math.max(0, point.value / maximum * 132)}
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

function ChartBar({ point, index, height, selected, active, currency, onSelect }: {
  point: InsightsChartPoint;
  index: number;
  height: number;
  selected: boolean;
  active: boolean;
  currency: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
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
      style={({ pressed }) => [styles.slot, { opacity: pressed ? 0.75 : 1 }]}>
      <ThemedText type="smallBold" style={[styles.value, { color: selected ? theme.text : theme.textSecondary }]} numberOfLines={1}>
        {currency ? `$${point.value.toFixed(0)}` : point.value}
      </ThemedText>
      <View style={styles.barTrack}>
        <Animated.View testID="insights-chart-bar" style={[
          styles.bar,
          { backgroundColor: selected ? theme.tint : theme.success },
          barStyle,
        ]} />
      </View>
      <ThemedText type="small" style={[styles.label, { color: selected ? theme.text : theme.textSecondary }]} numberOfLines={2}>
        {point.label}
      </ThemedText>
      <View style={[styles.selectionMark, { backgroundColor: selected ? theme.tint : 'transparent' }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chart: { gap: 16 },
  readout: { height: 94, gap: 6, justifyContent: 'center' },
  selectionName: { fontSize: 17, lineHeight: 23 },
  detail: { fontSize: 13, lineHeight: 19, fontVariant: ['tabular-nums'] },
  scrollContent: { flexGrow: 1 },
  plot: { flex: 1, flexDirection: 'row', gap: 10, position: 'relative' },
  guide: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, opacity: 0.35 },
  emptyPlot: { height: 218, width: '100%' },
  slot: { flex: 1, minWidth: 66, alignItems: 'center' },
  value: { height: 26, fontSize: 12, lineHeight: 20, maxWidth: 66, fontVariant: ['tabular-nums'] },
  barTrack: { height: 132, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  bar: { width: 28, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  label: { width: 66, height: 44, marginTop: 10, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  selectionMark: { width: 14, height: 3, borderRadius: 2, marginTop: 3 },
});