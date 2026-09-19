import { useMemo, useState } from 'react';
import { usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { GlassSurface } from '@/components/glass-surface';
import { AnimatedInsightsChart } from '@/components/animated-insights-chart';
import { SalePlaneFlight } from '@/components/sale-plane-flight';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EntranceMotion } from '@/constants/motion';
import { Radius } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useTheme } from '@/hooks/use-theme';
import {
  getItemRevenue,
  useInventoryStore,
  type InventoryItem,
} from '@/providers/inventory-store';

type ChartPoint = {
  id: string;
  label: string;
  conversions: number;
  revenue: number;
};

export default function SoldTodayScreen() {
  const theme = useTheme();
  const { isTablet, compactContentWidth } = useDeviceLayout();
  const {
    soldItems,
    revenueHistory,
    totalRevenue,
    totalSoldUnits,
    previousTotalRevenue,
    previousTotalSoldUnits,
    pendingSaleFlights,
    completeSaleFlight,
  } = useInventoryStore();
  const pathname = usePathname();
  const flightId = pendingSaleFlights[0];
  const [showHistory, setShowHistory] = useState(false);
  const [chartMode, setChartMode] = useState<'units' | 'revenue'>('units');

  const topItems = useMemo(() => {
    return [...soldItems].sort((left, right) => right.soldToday - left.soldToday);
  }, [soldItems]);

  const chartData = useMemo(() => buildDailyCompositionData(topItems), [topItems]);
  const revenueDelta = totalRevenue - previousTotalRevenue;
  const soldDelta = totalSoldUnits - previousTotalSoldUnits;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={[styles.maxWidth, { maxWidth: isTablet ? 1180 : compactContentWidth }]}>
            <View style={styles.chartLayout}>
              <Animated.View
                entering={FadeInDown.duration(EntranceMotion.section)}
                style={styles.chartColumn}>
                <GlassSurface
                  style={[
                    styles.heroCard,
                    isTablet && styles.heroCardTablet,
                    {
                      borderColor: theme.border,
                      shadowColor: theme.shadow,
                    },
                  ]}>
                  <View style={styles.heroHeader}>
                    <View style={styles.heroHeaderCopy}>
                      <View style={[styles.rangePill, { backgroundColor: theme.surfaceMuted }]}>
                        <View style={styles.rangePillContent}>
                          <SymbolView name="calendar" size={12} tintColor={theme.textSecondary} />
                          <ThemedText type="smallBold" themeColor="textSecondary">
                            Today
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.heroBadge,
                        {
                          backgroundColor: theme.tintMuted,
                          borderColor: theme.border,
                        },
                      ]}>
                      <View style={styles.heroBadgeContent}>
                        <SymbolView name="dot.radiowaves.left.and.right" size={12} tintColor={theme.tint} />
                        <ThemedText type="smallBold" style={{ color: theme.tint }}>
                          Live
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <ThemedText type="title" style={styles.insightsTitle}>Sales insights</ThemedText>

                  <View style={styles.metricsRow}>
                    <MetricBlock
                      label="Conversions"
                      value={String(totalSoldUnits)}
                      detail={`${topItems.length} sold item${topItems.length === 1 ? '' : 's'}`}
                      delta={soldDelta}
                      deltaVariant="count"
                      align="left"
                    />
                    <MetricBlock
                      label="Earnings"
                      value={`$${totalRevenue.toFixed(2)}`}
                      detail="Daily revenue"
                      delta={revenueDelta}
                      deltaVariant="currency"
                      align="right"
                    />
                  </View>

                  <View style={styles.legendRow}>
                    <LegendDot color={theme.tint} label="Top sellers" />
                  </View>
                  <View accessibilityRole="tablist" style={[styles.chartModes, { backgroundColor: theme.surfaceMuted }]}>
                    {(['units', 'revenue'] as const).map((mode) => (
                      <Pressable
                        key={mode}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: chartMode === mode }}
                        onPress={() => setChartMode(mode)}
                        style={[styles.chartMode, { backgroundColor: chartMode === mode ? theme.surfaceElevated : 'transparent' }]}>
                        <ThemedText type="smallBold" style={styles.chartModeLabel}>{mode === 'units' ? 'Units sold' : 'Revenue'}</ThemedText>
                      </Pressable>
                    ))}
                  </View>

                  <View
                    style={[
                      styles.chartFrame,
                      {
                        borderColor: theme.border,
                      },
                    ]}>
                    <MiniRevenueChart data={chartData} mode={chartMode} />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showHistory ? 'Hide previous days' : 'Show previous days'}
                    accessibilityState={{ expanded: showHistory }}
                    aria-expanded={showHistory}
                    onPress={() => setShowHistory((current) => !current)}
                    style={({ pressed }) => [
                      styles.revealButton,
                      {
                        borderColor: theme.border,
                        backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
                        transform: [{ scale: pressed ? 0.985 : 1 }],
                      },
                    ]}>
                    <ThemedText type="smallBold">
                      {showHistory ? 'Hide previous days' : 'Show previous days'}
                    </ThemedText>
                  </Pressable>
                </GlassSurface>
              </Animated.View>
            </View>

            {showHistory ? (
              <Animated.View entering={FadeInDown.duration(EntranceMotion.section)} style={styles.historyWrap}>
                <HistorySection entries={revenueHistory} />
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>
        {pathname === '/explore' && flightId !== undefined ? (
          <SalePlaneFlight key={flightId} flightId={flightId} onComplete={completeSaleFlight} />
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

function MetricBlock({
  label,
  value,
  detail,
  delta,
  deltaVariant,
  align,
}: {
  label: string;
  value: string;
  detail: string;
  delta: number;
  deltaVariant: 'count' | 'currency';
  align: 'left' | 'right';
}) {
  const theme = useTheme();
  const deltaTone = delta > 0 ? theme.success : delta < 0 ? theme.danger : theme.textMuted;
  const deltaSymbol = delta > 0 ? '▲' : delta < 0 ? '▼' : '•';

  return (
    <View style={[styles.metricBlock, align === 'right' && styles.metricBlockRight]}>
      <View style={styles.metricValueRow}>
        <ThemedText type="sectionTitle">{value}</ThemedText>
        <ThemedText type="smallBold" style={{ color: deltaTone }}>
          {`${deltaSymbol} ${formatDelta(delta, deltaVariant)}`}
        </ThemedText>
      </View>
      <View style={[styles.utilityLabelRow, align === 'right' && styles.utilityLabelRowRight]}>
        <SymbolView
          name={label === 'Earnings' ? 'dollarsign.circle.fill' : 'shippingbox.fill'}
          size={14}
          tintColor={theme.tint}
        />
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textMuted">
        {detail}
      </ThemedText>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function MiniRevenueChart({ data, mode }: { data: ChartPoint[]; mode: 'units' | 'revenue' }) {
  return (
    <AnimatedInsightsChart
      label="Today's sales"
      currency={mode === 'revenue'}
      data={data.map((point) => ({
        id: point.id,
        label: point.label,
        value: mode === 'units' ? point.conversions : point.revenue,
        detail: mode === 'units' ? `$${point.revenue.toFixed(2)} revenue` : `${point.conversions} units sold`,
      }))}
    />
  );
}

function SalesSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: InventoryItem[];
}) {
  const theme = useTheme();
  const { isTablet } = useDeviceLayout();
  const sectionRevenueTotal = items.reduce((sum, current) => sum + current.soldToday * current.price, 0);

  return (
    <View style={styles.section}>
      <View style={styles.headerLabelRow}>
        <SymbolView name="list.bullet.rectangle.portrait.fill" size={18} tintColor={theme.tint} />
        <ThemedText type="sectionTitle">{title}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {subtitle}
      </ThemedText>

      <GlassSurface
        style={[
          styles.sectionCard,
          isTablet && styles.sectionCardTablet,
          { borderColor: theme.border, shadowColor: theme.shadow },
        ]}>
        {items.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyState}>
            No items in this section right now.
          </ThemedText>
        ) : (
          items.map((item, index) => (
            <SalesRow
              key={item.id}
              item={item}
              index={index}
              totalRevenue={sectionRevenueTotal}
              showBorder={index < items.length - 1}
            />
          ))
        )}
      </GlassSurface>
    </View>
  );
}

function HistorySection({ entries }: { entries: { dateKey: string; revenue: number; unitsSold: number; soldItemsCount: number }[] }) {
  const theme = useTheme();
  const { isTablet } = useDeviceLayout();

  return (
    <View style={styles.section}>
      <View style={styles.headerLabelRow}>
        <SymbolView name="clock.arrow.circlepath" size={18} tintColor={theme.tint} />
        <ThemedText type="sectionTitle">Previous days</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Review recent revenue totals after each daily reset.
      </ThemedText>

      {entries.length > 0 ? (
        <AnimatedInsightsChart
          label="Recent daily revenue"
          currency
          data={entries.slice(0, 7).reverse().map((entry) => ({
            id: entry.dateKey,
            label: formatHistoryDate(entry.dateKey),
            value: entry.revenue,
            detail: `${entry.unitsSold} units sold`,
          }))}
        />
      ) : null}

      <GlassSurface
        style={[
          styles.sectionCard,
          isTablet && styles.sectionCardTablet,
          { borderColor: theme.border, shadowColor: theme.shadow },
        ]}>
        {entries.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyState}>
            Previous days will appear here after the first daily rollover.
          </ThemedText>
        ) : (
          entries.slice(0, 7).map((entry, index) => (
            <HistoryRow
              key={entry.dateKey}
              entry={entry}
              index={index}
              showBorder={index < Math.min(entries.length, 7) - 1}
            />
          ))
        )}
      </GlassSurface>
    </View>
  );
}

function HistoryRow({
  entry,
  index,
  showBorder,
}: {
  entry: { dateKey: string; revenue: number; unitsSold: number; soldItemsCount: number };
  index: number;
  showBorder: boolean;
}) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(EntranceMotion.item).delay(90 + Math.min(index * 45, 220))}
      style={[
        styles.historyRow,
        showBorder && {
          borderBottomColor: theme.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}>
      <View style={styles.historyRowText}>
        <ThemedText type="smallBold">{formatHistoryDate(entry.dateKey)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {entry.unitsSold} units across {entry.soldItemsCount} item{entry.soldItemsCount === 1 ? '' : 's'}
        </ThemedText>
      </View>
      <ThemedText type="smallBold">${entry.revenue.toFixed(2)}</ThemedText>
    </Animated.View>
  );
}

function SalesRow({
  item,
  index,
  totalRevenue,
  showBorder,
}: {
  item: InventoryItem;
  index: number;
  totalRevenue: number;
  showBorder: boolean;
}) {
  const theme = useTheme();
  const { isTablet } = useDeviceLayout();
  const revenue = getItemRevenue(item);
  const contribution = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

  return (
    <Animated.View
      entering={
        FadeInDown.duration(EntranceMotion.item).delay(
          90 + Math.min(index * 45, 220)
        )
      }
      layout={LinearTransition.springify().damping(18).stiffness(180)}
      style={[
        styles.row,
        isTablet && styles.rowTablet,
        showBorder && {
          borderBottomColor: theme.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}>
      <View style={styles.rowMain}>
        <View
          style={[
            styles.rowIcon,
            isTablet && styles.rowIconTablet,
            { backgroundColor: theme.tintMuted },
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            {item.soldToday}
          </ThemedText>
        </View>

        <View style={styles.rowTextWrap}>
          <ThemedText type="smallBold">{item.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {item.isVariablePrice
              ? `${item.soldToday} sold with entered sale prices`
              : `${item.soldToday} sold at $${item.price.toFixed(2)} each`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Revenue: ${revenue.toFixed(2)}
          </ThemedText>
          <ThemedText type="small" themeColor="textMuted">
            {contribution.toFixed(0)}% of today&apos;s revenue
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

function buildDailyCompositionData(items: InventoryItem[]): ChartPoint[] {
  return items.slice(0, 7).map((item) => ({
    id: item.id,
    label: item.name,
    conversions: item.soldToday,
    revenue: getItemRevenue(item),
  }));
}

function formatDelta(value: number, variant: 'count' | 'currency') {
  if (value > 0) {
    return `+${formatDeltaValue(value, variant)}`;
  }

  if (value < 0) {
    return `-${formatDeltaValue(Math.abs(value), variant)}`;
  }

  return variant === 'currency' ? '$0.00' : '0';
}

function formatDeltaValue(value: number, variant: 'count' | 'currency') {
  if (variant === 'currency') {
    return `$${value.toFixed(2)}`;
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatHistoryDate(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  maxWidth: {
    width: '100%',
    alignSelf: 'center',
  },
  chartLayout: {
    gap: 18,
  },
  chartColumn: {
    width: '100%',
    minWidth: 0,
  },
  detailColumn: {
    flex: 1.05,
  },
  historyWrap: {
    marginTop: 18,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  heroCardTablet: {
    padding: 22,
    gap: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroHeaderCopy: {
    flex: 1,
    gap: 12,
  },
  insightsTitle: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
  },
  rangePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  rangePillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadge: {
    minWidth: 58,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  metricBlock: {
    flex: 1,
    flexBasis: 180,
    minWidth: 0,
    gap: 6,
  },
  metricBlockRight: {
    alignItems: 'flex-end',
  },
  utilityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  utilityLabelRowRight: {
    justifyContent: 'flex-end',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  chartModes: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 8,
    gap: 4,
  },
  chartMode: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartModeLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  chartFrame: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
  },
  revealButton: {
    minHeight: 54,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  section: {
    gap: 10,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  sectionCardTablet: {
    marginTop: 4,
  },
  emptyState: {
    padding: 18,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  historyRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  historyRowText: {
    flex: 1,
    gap: 4,
  },
  rowTablet: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    gap: 14,
    minHeight: 108,
  },
  rowMain: {
    flexDirection: 'row',
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconTablet: {
    width: 50,
    height: 50,
    borderRadius: 16,
  },
  rowTextWrap: {
    flex: 1,
    gap: 4,
  },
});
