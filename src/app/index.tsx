import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  FadeInDown,
  FadeInRight,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { GlassSurface } from '@/components/glass-surface';
import { SaleMoneyBurst } from '@/components/sale-money-burst';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EntranceMotion } from '@/constants/motion';
import { Fonts, Radius } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useTheme } from '@/hooks/use-theme';
import {
  getItemLastSalePrice,
  getItemRevenue,
  useInventoryStore,
  type InventoryItem,
} from '@/providers/inventory-store';

export default function InventoryScreen() {
  const theme = useTheme();
  const { isTablet, useColumns, compactContentWidth, height, fontScale } = useDeviceLayout();
  const {
    items,
    soldItems,
    firestoreStatus,
    firestoreError,
    totalRevenue,
    totalSoldUnits,
    addSoldItem,
    removeSoldItem,
  } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [showAllItems, setShowAllItems] = useState(false);
  const [variablePriceItemId, setVariablePriceItemId] = useState<string | null>(null);
  const [variablePriceValue, setVariablePriceValue] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const haystack = `${item.name} ${item.sku} ${item.location}`.toLowerCase();
      return deferredSearch.length === 0 || haystack.includes(deferredSearch);
    });
  }, [deferredSearch, items]);

  const visibleItems = showAllItems || deferredSearch.length > 0
    ? filteredItems
    : filteredItems.slice(0, 6);

  const topSellingItems = useMemo(() => {
    return [...soldItems].sort((left, right) => right.soldToday - left.soldToday).slice(0, 3);
  }, [soldItems]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          stickyHeaderIndices={height >= 600 && fontScale <= 1.3 ? [1] : undefined}>
          <Animated.View
            entering={FadeInDown.duration(EntranceMotion.screen)}
            style={[styles.maxWidth, styles.pageHeader, { maxWidth: isTablet ? 1320 : compactContentWidth }]}>
            <View style={styles.pageTitleRow}>
              <View style={styles.pageTitleWrap}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.pageEyebrow}>
                  DAILY OPERATIONS
                </ThemedText>
                <ThemedText type="title" style={styles.pageTitle}>Inventory</ThemedText>
              </View>
              <View style={styles.utilityLabelRow}>
                <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} size={16} tintColor={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.dateLabel}>
                  {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.overviewBand, { borderColor: theme.textMuted }]}>
              <View style={[styles.revenueMetric, !isTablet && styles.revenueMetricMobile]}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>Today's revenue</ThemedText>
                <ThemedText type="title" style={styles.revenueValue}>${totalRevenue.toFixed(2)}</ThemedText>
              </View>
              <View style={styles.overviewMetric}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>Units sold</ThemedText>
                <ThemedText type="smallBold" style={styles.overviewValue}>{totalSoldUnits}</ThemedText>
              </View>
              <View style={styles.overviewMetric}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>Items sold</ThemedText>
                <ThemedText type="smallBold" style={styles.overviewValue}>{soldItems.length}</ThemedText>
              </View>
            </View>
          </Animated.View>
          <View
            style={[
              styles.stickyHeaderShell,
              {
                backgroundColor: theme.background,
              },
            ]}>
            <View
              style={[
                styles.maxWidth,
                styles.stickyHeaderInner,
                {
                  maxWidth: isTablet ? 1320 : compactContentWidth,
                },
              ]}>
              <View
                style={[
                  styles.stickyHeaderRow,
                  useColumns && styles.stickyHeaderRowWide,
                ]}>
                <Animated.View
                  entering={FadeInDown.duration(EntranceMotion.screen)}
                  style={styles.listColumn}>
                  {firestoreStatus === 'error' ? (
                    <GlassSurface
                      style={[
                        styles.firestoreNotice,
                        {
                          borderColor: theme.danger,
                          backgroundColor: theme.surfaceElevated,
                        },
                      ]}
                      variant="muted">
                      <View style={styles.utilityLabelRow}>
                        <SymbolView
                          name="exclamationmark.triangle.fill"
                          size={15}
                          tintColor={theme.danger}
                        />
                        <ThemedText type="smallBold" style={{ color: theme.danger }}>
                          Firestore connection issue
                        </ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        {firestoreError ?? 'Unable to load inventory from Firestore.'}
                      </ThemedText>
                    </GlassSurface>
                  ) : null}

                  {firestoreStatus === 'empty' ? (
                    <GlassSurface
                      style={[
                        styles.firestoreNotice,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.surfaceElevated,
                        },
                      ]}
                      variant="muted">
                      <View style={styles.utilityLabelRow}>
                        <SymbolView name="tray.fill" size={15} tintColor={theme.tint} />
                        <ThemedText type="smallBold">Firestore returned no items</ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        Collection `1` is reachable, but it currently has no documents.
                      </ThemedText>
                    </GlassSurface>
                  ) : null}

                  <GlassSurface
                    style={[
                      styles.searchShell,
                      {
                        borderColor: theme.border,
                        alignSelf: isTablet ? 'stretch' : 'auto',
                        minHeight: isTablet ? 58 : 48,
                        borderRadius: 12,
                        paddingHorizontal: isTablet ? 20 : 14,
                      },
                    ]}
                    variant="elevated">
                    <SymbolView
                      name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                      size={isTablet ? 22 : 17}
                      tintColor={theme.textMuted}
                      style={styles.searchIcon}
                    />
                    <TextInput
                      placeholder="Search inventory"
                      accessibilityLabel="Search inventory"
                      placeholderTextColor={theme.textMuted}
                      value={search}
                      onChangeText={setSearch}
                      style={[
                        styles.searchInput,
                        {
                          color: theme.text,
                          fontSize: isTablet ? 22 : 18,
                          lineHeight: isTablet ? 30 : 26,
                        },
                      ]}
                    />
                    {search.length > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear search"
                        onPress={() => setSearch('')}
                        style={styles.clearSearch}>
                        <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} size={20} tintColor={theme.textSecondary} />
                      </Pressable>
                    ) : null}
                  </GlassSurface>
                </Animated.View>

                {useColumns ? <View style={styles.summaryColumn} /> : null}
              </View>
            </View>
          </View>

          <View
            style={[
              styles.maxWidth,
              {
                maxWidth: isTablet ? 1320 : compactContentWidth,
              },
            ]}>
            <View style={[styles.tabletLayout, useColumns && styles.tabletLayoutWide]}>
              <View style={styles.listColumn}>
                <View style={styles.sectionHeading}>
                  <ThemedText type="sectionTitle" style={styles.sectionTitle}>Catalog</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                  </ThemedText>
                </View>
                <Animated.View
                  entering={FadeInDown.duration(EntranceMotion.section).delay(80)}>
                  <View
                    style={[
                      styles.listCard,
                      {
                        borderColor: theme.border,
                        shadowColor: theme.shadow,
                      },
                    ]}>
                    {filteredItems.length === 0 ? (
                      <EmptySearchState />
                    ) : (
                      visibleItems.map((item, index) => (
                        <InventoryRow
                          key={item.id}
                          item={item}
                          index={index}
                          sellerRank={topSellingItems.findIndex((seller) => seller.id === item.id) + 1}
                          onAdd={() => {
                            if (item.isVariablePrice) {
                              setVariablePriceItemId(item.id);
                              setVariablePriceValue('');
                              return;
                            }

                            addSoldItem(item.id);
                          }}
                          onRemove={() => removeSoldItem(item.id)}
                          isVariablePriceExpanded={variablePriceItemId === item.id}
                          variablePriceValue={variablePriceValue}
                          onVariablePriceChange={setVariablePriceValue}
                          onVariablePriceCancel={() => {
                            setVariablePriceItemId(null);
                            setVariablePriceValue('');
                          }}
                          onVariablePriceSave={() => {
                            const parsed = Number(variablePriceValue);

                            if (!Number.isFinite(parsed) || parsed < 0) {
                              return;
                            }

                            addSoldItem(item.id, parsed);
                            setVariablePriceItemId(null);
                            setVariablePriceValue('');
                          }}
                        />
                      ))
                    )}
                    {deferredSearch.length === 0 && filteredItems.length > 6 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ expanded: showAllItems }}
                        onPress={() => setShowAllItems((current) => !current)}
                        style={({ pressed }) => [
                          styles.showMoreButton,
                          {
                            backgroundColor: pressed ? theme.surfaceMuted : theme.surfaceElevated,
                            borderColor: theme.border,
                          },
                        ]}>
                        <ThemedText type="smallBold" style={styles.showMoreLabel}>
                          {showAllItems ? 'Show less' : `Show more (${filteredItems.length - visibleItems.length})`}
                        </ThemedText>
                        <SymbolView
                          name={showAllItems
                            ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
                            : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
                          size={18}
                          tintColor={theme.text}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                </Animated.View>
              </View>

              {useColumns ? (
                <View style={styles.summaryColumn}>
                  <Animated.View entering={FadeInRight.duration(EntranceMotion.aside).delay(180)}>
                    <View
                      style={[
                        styles.summaryCard,
                        {
                          borderColor: theme.textMuted,
                        },
                      ]}>
                      <View style={styles.headerLabelRow}>
                        <SymbolView name={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }} size={18} tintColor={theme.tint} />
                        <ThemedText type="sectionTitle">Top sellers</ThemedText>
                      </View>
                      {topSellingItems.length === 0 ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          No sales yet today.
                        </ThemedText>
                      ) : (
                        topSellingItems.map((item, index) => (
                          <Animated.View
                            key={item.id}
                            entering={
                              FadeInDown.duration(EntranceMotion.item).delay(
                                220 + index * EntranceMotion.metricDelay
                              )
                            }
                            style={[styles.topSellerRow, { borderColor: theme.border }]}>
                            <View
                              style={[
                                styles.topSellerIconShell,
                                { backgroundColor: theme.surfaceElevated },
                              ]}>
                              <ThemedText type="smallBold" style={styles.rankLabel}>{index + 1}</ThemedText>
                            </View>
                            <View style={styles.topSellerTextWrap}>
                              <ThemedText type="smallBold">{item.name}</ThemedText>
                              <ThemedText type="small" themeColor="textSecondary">
                                {item.soldToday} sold
                              </ThemedText>
                            </View>
                            <ThemedText type="smallBold">
                              ${getItemRevenue(item).toFixed(2)}
                            </ThemedText>
                          </Animated.View>
                        ))
                      )}
                    </View>
                  </Animated.View>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function EmptySearchState() {
  const theme = useTheme();
  const { isTablet } = useDeviceLayout();

  return (
    <View
      style={[
        styles.emptyState,
        isTablet && styles.emptyStateTablet,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View
        style={[
          styles.emptyStateIconWrap,
          {
            backgroundColor: theme.surfaceMuted,
            borderColor: theme.border,
          },
        ]}>
        <SymbolView
          name="magnifyingglass.circle"
          size={isTablet ? 42 : 34}
          tintColor={theme.tint}
        />
      </View>

      <View style={styles.emptyStateTextWrap}>
        <ThemedText type="sectionTitle" style={styles.emptyStateTitle}>
          No matching items
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyStateSubtitle}>
          Try another product name or clear the search to see your full catalog again.
        </ThemedText>
      </View>
    </View>
  );
}

function InventoryRow({
  item,
  index,
  sellerRank,
  onAdd,
  onRemove,
  isVariablePriceExpanded,
  variablePriceValue,
  onVariablePriceChange,
  onVariablePriceCancel,
  onVariablePriceSave,
}: {
  item: InventoryItem;
  index: number;
  sellerRank: number;
  onAdd: () => void;
  onRemove: () => void;
  isVariablePriceExpanded: boolean;
  variablePriceValue: string;
  onVariablePriceChange: (value: string) => void;
  onVariablePriceCancel: () => void;
  onVariablePriceSave: () => void;
}) {
  const theme = useTheme();
  const { isTablet } = useDeviceLayout();
  const actionWidth = isTablet ? 132 : 108;
  const lastVariableSalePrice = getItemLastSalePrice(item);
  const nextBurstId = useRef(0);
  const salePulse = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => () => cancelAnimation(salePulse), [salePulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(salePulse.value, [0, 1], [theme.border, theme.success]),
    backgroundColor: interpolateColor(salePulse.value, [0, 1], [theme.surfaceElevated, theme.tintMuted]),
  }));
  const [moneyBursts, setMoneyBursts] = useState<{ id: number; amount: number }[]>([]);
  const completeMoneyBurst = useCallback((id: number) => {
    setMoneyBursts((current) => current.filter((burst) => burst.id !== id));
  }, []);
  const celebrateSale = (amount: number) => {
    if (!reducedMotion) {
      salePulse.value = 1;
      salePulse.value = withTiming(0, { duration: 850 });
    }
    const id = ++nextBurstId.current;
    setMoneyBursts((current) => [...current, { id, amount }]);
  };
  const handleAdd = () => {
    onAdd();
    if (!item.isVariablePrice) {
      celebrateSale(item.price);
    }
  };
  const variablePriceValid =
    Number.isFinite(Number(variablePriceValue)) && Number(variablePriceValue) >= 0;

  const renderSwipeAction = (
    side: 'left' | 'right',
    progress: SharedValue<number>,
    action: 'add' | 'remove'
  ) => {
    const isAdd = action === 'add';
    const isDisabled = action === 'remove' && item.soldToday === 0;

    return (
      <Animated.View
        style={[
          styles.swipeActionWrap,
          side === 'left' ? styles.swipeActionWrapLeft : styles.swipeActionWrapRight,
          { width: actionWidth },
        ]}>
        <GlassSurface
          variant={isAdd ? 'elevated' : 'muted'}
          style={[
            styles.swipeActionCard,
            {
              borderColor: isAdd ? theme.tint : theme.border,
              backgroundColor: isAdd ? theme.tint : theme.surfaceMuted,
              opacity: isDisabled ? 0.4 : 1,
            },
          ]}>
          <Pressable
            disabled={isDisabled}
            onPress={() => {
              if (isAdd) {
                handleAdd();
              } else {
                onRemove();
              }
            }}
            style={styles.swipeActionPressable}>
            <SymbolView
              name={isAdd ? { ios: 'plus', android: 'add', web: 'add' } : { ios: 'minus', android: 'remove', web: 'remove' }}
              size={isTablet ? 20 : 16}
              tintColor={isAdd ? '#FFFFFF' : item.soldToday === 0 ? theme.textMuted : theme.text}
            />
            <ThemedText
              type="smallBold"
              style={{
                color: isAdd ? '#FFFFFF' : item.soldToday === 0 ? theme.textMuted : theme.text,
              }}>
              {isAdd ? 'Add' : 'Remove'}
            </ThemedText>
          </Pressable>
        </GlassSurface>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      enableTrackpadTwoFingerGesture
      friction={1.8}
      leftThreshold={42}
      rightThreshold={42}
      overshootFriction={8}
      renderLeftActions={(progress) => renderSwipeAction('left', progress, 'add')}
      renderRightActions={(progress) => renderSwipeAction('right', progress, 'remove')}
      containerStyle={styles.swipeableContainer}>
      <Animated.View
        entering={
          FadeInDown.duration(EntranceMotion.screen).delay(
            Math.min(index * EntranceMotion.itemDelay, EntranceMotion.maxItemDelay)
          )
        }
        layout={LinearTransition.springify().damping(18).stiffness(180)}
        style={[
          styles.row,
          isTablet && styles.rowTablet,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
            borderLeftColor: item.soldToday > 0 ? theme.success : theme.border,
            shadowColor: theme.shadow,
          },
          pulseStyle,
        ]}>
        <View style={styles.rowMain}>
          <View style={styles.rowTextWrap}>
            <ThemedText type="smallBold" style={styles.itemName}>{item.name}</ThemedText>
            <View style={styles.itemStatusRow}>
              <SymbolView
                name={sellerRank > 0
                  ? { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' }
                  : { ios: 'clock', android: 'schedule', web: 'schedule' }}
                size={14}
                tintColor={sellerRank > 0 ? theme.warning : theme.textSecondary}
              />
              <ThemedText type="smallBold" style={[styles.itemDetail, { color: sellerRank > 0 ? theme.warning : theme.textSecondary }]}>
                {sellerRank > 0 ? `#${sellerRank} top seller` : item.soldToday > 0 ? 'Selling today' : 'Ready for a sale'}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.itemDetail}>
              {item.soldToday > 0 ? `Last sold ${item.lastSoldLabel}` : item.lastSoldLabel}
            </ThemedText>
          </View>
          <View style={styles.priceWrap}>
            <ThemedText type="smallBold" style={styles.itemPrice}>
              {item.isVariablePrice
                ? lastVariableSalePrice !== null
                  ? `$${lastVariableSalePrice.toFixed(2)}`
                  : 'Variable'
                : `$${item.price.toFixed(2)}`}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.itemDetail}>
              {item.isVariablePrice ? lastVariableSalePrice !== null ? 'last sale' : 'sale price' : 'each'}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.rowFooter, { borderColor: theme.border }]}>
          {moneyBursts.map((burst) => (
            <SaleMoneyBurst key={burst.id} {...burst} onComplete={completeMoneyBurst} />
          ))}
          <View style={styles.soldMetric}>
            <View style={[styles.soldCountShell, { backgroundColor: theme.background }]}>
              <ThemedText type="smallBold" style={styles.soldCount}>{item.soldToday}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.itemDetail}>sold today</ThemedText>
          </View>
          <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove one sale of ${item.name}`}
            accessibilityState={{ disabled: item.soldToday === 0 }}
            onPress={onRemove}
            disabled={item.soldToday === 0}
            style={({ pressed }) => [
              styles.secondaryAction,
              isTablet && styles.secondaryActionTablet,
              {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
                opacity: item.soldToday === 0 ? 0.45 : 1,
                shadowColor: theme.shadow,
                transform: [{ scale: pressed ? 0.972 : 1 }, { translateY: pressed ? 2 : 0 }],
              },
            ]}>
            {({ pressed }) => (
              <>
                <View
                  pointerEvents="none"
                  style={[
                    styles.actionPressOverlay,
                    {
                      backgroundColor: theme.background,
                      opacity: pressed ? 0.34 : 0,
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.actionInnerShadow,
                    {
                      borderColor: theme.border,
                      opacity: pressed ? 1 : 0,
                    },
                  ]}
                />
                <SymbolView name={{ ios: 'minus', android: 'remove', web: 'remove' }} size={18} tintColor={item.soldToday === 0 ? theme.textMuted : theme.text} />
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add sale of ${item.name}`}
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.primaryAction,
              isTablet && styles.primaryActionTablet,
              {
                backgroundColor: theme.tint,
                borderColor: theme.tint,
                shadowColor: theme.tint,
                shadowOpacity: pressed ? 0 : 0.12,
                transform: [{ scale: pressed ? 0.97 : 1 }, { translateY: pressed ? 2 : 0 }],
              },
            ]}>
            {({ pressed }) => (
              <>
                <View
                  pointerEvents="none"
                  style={[
                    styles.actionPressOverlay,
                    {
                      backgroundColor: '#000000',
                      opacity: pressed ? 0.14 : 0,
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.actionInnerShadow,
                    {
                      borderColor: '#FFFFFF',
                      opacity: pressed ? 0.34 : 0,
                    },
                  ]}
                />
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={18} tintColor="#FFFFFF" />
              </>
            )}
          </Pressable>
          </View>
        </View>

        {item.isVariablePrice && isVariablePriceExpanded ? (
          <Animated.View entering={FadeInDown.duration(180)} style={styles.variablePriceEditor}>
            <GlassSurface
              style={[styles.variablePriceInputShell, { borderColor: theme.border }]}
              variant="elevated">
              <ThemedText type="small" themeColor="textSecondary">
                Sale price
              </ThemedText>
              <TextInput
                placeholder="Enter price"
                placeholderTextColor={theme.textMuted}
                value={variablePriceValue}
                onChangeText={onVariablePriceChange}
                accessibilityLabel={`Sale price for ${item.name}`}
                keyboardType="decimal-pad"
                style={[styles.variablePriceInput, { color: theme.text }]}
              />
            </GlassSurface>

            <View style={styles.variablePriceActions}>
              <Pressable
                onPress={onVariablePriceCancel}
                style={({ pressed }) => [
                  styles.variablePriceCancelButton,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceMuted,
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}>
                <ThemedText type="small">Cancel</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (!variablePriceValid) {
                    return;
                  }
                  onVariablePriceSave();
                  celebrateSale(Number(variablePriceValue));
                }}
                disabled={!variablePriceValid}
                style={({ pressed }) => [
                  styles.variablePriceSaveButton,
                  {
                    backgroundColor: theme.tint,
                    opacity: !variablePriceValid ? 0.45 : pressed ? 0.86 : 1,
                  },
                ]}>
                <ThemedText type="small" style={{ color: '#FFFFFF' }}>
                  Confirm sale
                </ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Swipeable>
  );
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
    gap: 10,
  },
  pageHeader: {
    paddingTop: 18,
    paddingBottom: 12,
    gap: 24,
  },
  pageTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  pageTitleWrap: {
    gap: 6,
  },
  pageEyebrow: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0,
  },
  pageTitle: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
  },
  dateLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  overviewBand: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 24,
  },
  revenueMetric: {
    flexGrow: 2,
    flexBasis: 180,
    gap: 8,
  },
  revenueMetricMobile: {
    flexBasis: '100%',
  },
  overviewMetric: {
    flexGrow: 1,
    flexBasis: 80,
    gap: 8,
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  revenueValue: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  overviewValue: {
    fontSize: 28,
    lineHeight: 36,
    fontVariant: ['tabular-nums'],
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  clearSearch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeaderShell: {
    paddingTop: 10,
    paddingBottom: 12,
  },
  stickyHeaderInner: {
    gap: 0,
  },
  stickyHeaderRow: {
    gap: 18,
  },
  stickyHeaderRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabletLayout: {
    gap: 18,
  },
  tabletLayoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listColumn: {
    flex: 1.45,
    gap: 14,
  },
  summaryColumn: {
    flex: 0.9,
    gap: 16,
  },
  firestoreNotice: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    gap: 6,
  },
  searchShell: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.sans,
    fontWeight: '500',
    paddingVertical: 11,
  },
  listCard: {
    gap: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    overflow: 'visible',
  },
  showMoreButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  showMoreLabel: {
    fontSize: 16,
    lineHeight: 22,
  },
  summaryCard: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    marginTop: 8,
    gap: 20,
  },
  headerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  utilityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  emptyState: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyStateTablet: {
    minHeight: 280,
    paddingHorizontal: 28,
    paddingVertical: 34,
  },
  emptyStateIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTextWrap: {
    gap: 8,
    alignItems: 'center',
    maxWidth: 320,
  },
  emptyStateTitle: {
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    textAlign: 'center',
  },
  row: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 12,
  },
  rowTablet: {
    paddingHorizontal: 22,
    paddingVertical: 22,
    gap: 16,
    minHeight: 148,
    justifyContent: 'space-between',
  },
  rowMain: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  rowTextWrap: {
    flex: 1,
    minWidth: 120,
    gap: 6,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
  itemDetail: {
    fontSize: 13,
    lineHeight: 19,
  },
  itemStatusRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceWrap: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: '100%',
  },
  itemPrice: {
    fontSize: 24,
    lineHeight: 32,
    fontVariant: ['tabular-nums'],
  },
  rowFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  soldMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  soldCountShell: {
    minWidth: 38,
    minHeight: 38,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldCount: {
    fontSize: 20,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
  swipeableContainer: {
    overflow: 'visible',
  },
  swipeActionWrap: {
    justifyContent: 'center',
    paddingVertical: 8,
  },
  swipeActionWrapLeft: {
    paddingRight: 10,
  },
  swipeActionWrapRight: {
    alignItems: 'flex-end',
    paddingLeft: 10,
  },
  swipeActionCard: {
    flex: 1,
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  swipeActionPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 90,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'flex-end',
  },
  variablePriceEditor: {
    gap: 10,
  },
  variablePriceInputShell: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  variablePriceInput: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    paddingVertical: 2,
  },
  variablePriceActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
  },
  variablePriceCancelButton: {
    minHeight: 44,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variablePriceSaveButton: {
    minHeight: 44,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 124,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topSellerIconShell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSellerTextWrap: {
    flex: 1,
    gap: 2,
  },
  rankLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  secondaryAction: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 0,
  },
  secondaryActionTablet: {
    width: 48,
    height: 48,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryAction: {
    position: 'relative',
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryActionTablet: {
    width: 56,
    height: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  actionPressOverlay: {
    ...StyleSheet.absoluteFill,
  },
  actionInnerShadow: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
});
