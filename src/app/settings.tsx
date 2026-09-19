import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { GlassSurface } from '@/components/glass-surface';
import { SecuritySettings } from '@/components/security-settings';
import { ThemeModeToggle } from '@/components/theme-mode-toggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EntranceMotion } from '@/constants/motion';
import { Radius } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useTheme } from '@/hooks/use-theme';
import { useInventoryStore } from '@/providers/inventory-store';
import { useAuthSession } from '@/providers/auth-session';
import { useThemePreference } from '@/providers/theme-preference';
import { exportRevenueReport } from '@/utils/revenue-report';

export default function SettingsScreen() {
  const theme = useTheme();
  const { isTablet, useColumns, compactContentWidth } = useDeviceLayout();
  const preferenceContext = useThemePreference();
  const { soldItems, totalRevenue, totalSoldUnits, currentDateKey } = useInventoryStore();
  const [isExporting, setIsExporting] = useState(false);
  const { user, logOut } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [exportExpanded, setExportExpanded] = useState(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    setAccountError('');
    try {
      await logOut();
    } catch {
      setAccountError('Unable to sign out. Please try again.');
      setSigningOut(false);
    }
  }

  const handleExportRevenue = async () => {
    try {
      setIsExporting(true);
      await exportRevenueReport({ soldItems, totalRevenue, totalSoldUnits, reportDateKey: currentDateKey });
    } catch (error) {
      Alert.alert(
        'Export failed',
        error instanceof Error ? error.message : 'Unable to create the PDF right now.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={[styles.contentInner, { maxWidth: isTablet ? 1240 : compactContentWidth }]}>
            <View style={styles.settingsSection}>
              <GlassSurface style={[styles.accountCard, { borderColor: theme.border }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Account Info"
                  accessibilityState={{ expanded: accountExpanded }}
                  onPress={() => setAccountExpanded((expanded) => !expanded)}
                  style={({ pressed }) => [styles.accountTab, { opacity: pressed ? 0.6 : 1 }]}>
                  <View style={styles.quickToggleIntro}>
                    <View style={styles.headerLabelRow}>
                      <SymbolView name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} size={22} tintColor={theme.tint} />
                      <ThemedText type="sectionTitle">Account Info</ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">Your profile and sign-in details</ThemedText>
                  </View>
                  <SymbolView name={{ ios: accountExpanded ? 'chevron.up' : 'chevron.down', android: accountExpanded ? 'expand_less' : 'expand_more', web: accountExpanded ? 'expand_less' : 'expand_more' }} size={18} tintColor={theme.textSecondary} />
                </Pressable>
                {accountExpanded ? (
                  <View style={[styles.accountDetails, { borderTopColor: theme.border }]}>
                    <View style={styles.accountField}>
                      <ThemedText type="small" themeColor="textSecondary">Name</ThemedText>
                      <ThemedText type="smallBold" selectable>{user?.displayName || 'Not provided'}</ThemedText>
                    </View>
                    <View style={styles.accountField}>
                      <ThemedText type="small" themeColor="textSecondary">Email</ThemedText>
                      <ThemedText type="smallBold" selectable>{user?.email || 'Not provided'}</ThemedText>
                    </View>
                    <View style={styles.accountField}>
                      <ThemedText type="small" themeColor="textSecondary">Password</ThemedText>
                      <ThemedText type="smallBold" accessibilityLabel="Password hidden">••••••••</ThemedText>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel="Sign out" disabled={signingOut} onPress={() => void handleSignOut()} style={({ pressed }) => ({ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.textMuted, opacity: pressed || signingOut ? 0.6 : 1 })}>
                      {signingOut ? <ActivityIndicator color={theme.text} /> : <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} size={18} tintColor={theme.text} />}
                      <ThemedText type="smallBold">{signingOut ? 'Signing out...' : 'Sign out'}</ThemedText>
                    </Pressable>
                    {accountError ? <ThemedText accessibilityRole="alert" style={{ color: theme.danger }}>{accountError}</ThemedText> : null}
                  </View>
                ) : null}
              </GlassSurface>

            </View>
            <SecuritySettings />
            <Animated.View style={styles.settingsSection} entering={FadeInDown.duration(EntranceMotion.screen)}>
              <GlassSurface
                style={[
                  styles.accountCard,
                  {
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                  },
                ]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Appearance"
                  accessibilityState={{ expanded: appearanceExpanded }}
                  onPress={() => setAppearanceExpanded((expanded) => !expanded)}
                  style={({ pressed }) => [styles.accountTab, { opacity: pressed ? 0.6 : 1 }]}>
                  <View style={styles.quickToggleIntro}>
                    <View style={styles.headerLabelRow}>
                      <SymbolView name="paintbrush.pointed.fill" size={18} tintColor={theme.tint} />
                      <ThemedText type="sectionTitle">Appearance</ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {preferenceContext?.preference === 'dark' ? 'Dark' : 'Light'} mode · Make the app your own
                    </ThemedText>
                  </View>
                  <SymbolView name={{ ios: appearanceExpanded ? 'chevron.up' : 'chevron.down', android: appearanceExpanded ? 'expand_less' : 'expand_more', web: appearanceExpanded ? 'expand_less' : 'expand_more' }} size={18} tintColor={theme.textSecondary} />
                </Pressable>
                {appearanceExpanded ? (
                  <View style={[styles.accountDetails, { borderTopColor: theme.border }]}>
                    <ThemeModeToggle />
                    <ThemePreviewCard currentMode={preferenceContext?.preference === 'dark' ? 'Dark' : 'Light'} />
                  </View>
                ) : null}
              </GlassSurface>
            </Animated.View>

            <View style={styles.settingsSection}>
              <Animated.View
                style={styles.settingsSection}
                entering={
                  useColumns
                    ? FadeInRight.duration(EntranceMotion.aside).delay(90)
                    : FadeInDown.duration(EntranceMotion.aside).delay(90)
                }>
                <GlassSurface
                  style={[
                    styles.accountCard,
                    { borderColor: theme.border, shadowColor: theme.shadow },
                  ]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Revenue Export"
                    accessibilityState={{ expanded: exportExpanded }}
                    onPress={() => setExportExpanded((expanded) => !expanded)}
                    style={({ pressed }) => [styles.accountTab, { opacity: pressed ? 0.6 : 1 }]}>
                    <View style={styles.quickToggleIntro}>
                      <View style={styles.headerLabelRow}>
                        <SymbolView name="doc.richtext.fill" size={18} tintColor={theme.tint} />
                        <ThemedText type="sectionTitle">Revenue Export</ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">Your daily sales, ready to share</ThemedText>
                    </View>
                    <SymbolView name={{ ios: exportExpanded ? 'chevron.up' : 'chevron.down', android: exportExpanded ? 'expand_less' : 'expand_more', web: exportExpanded ? 'expand_less' : 'expand_more' }} size={18} tintColor={theme.textSecondary} />
                  </Pressable>
                  {exportExpanded ? (
                    <View style={[styles.accountDetails, { borderTopColor: theme.border }]}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Export the current revenue overview as a PDF, then send it with AirDrop, save it to Files, or print it from the share sheet.
                      </ThemedText>

                      <ExportPreviewCard
                        currentDateKey={currentDateKey}
                        soldItemsCount={soldItems.length}
                        totalRevenue={totalRevenue}
                        totalSoldUnits={totalSoldUnits}
                      />

                      <View style={styles.metricGrid}>
                        <MetricCard label="Revenue" value={`$${totalRevenue.toFixed(2)}`} delay={120} />
                        <MetricCard label="Units Sold" value={String(totalSoldUnits)} delay={180} />
                        <MetricCard label="Sold Items" value={String(soldItems.length)} delay={240} />
                      </View>

                      <View style={styles.exportActionRow}>
                        <GlassSurface
                          variant="muted"
                          style={[
                            styles.exportUtilityCard,
                            {
                              borderColor: theme.border,
                              backgroundColor: theme.surfaceMuted,
                            },
                          ]}>
                          <View style={styles.utilityLabelRow}>
                            <SymbolView name="checkmark.seal.fill" size={15} tintColor={theme.tint} />
                            <ThemedText type="smallBold">Ready to export</ThemedText>
                          </View>
                          <ThemedText type="small" themeColor="textSecondary">
                            Includes revenue totals, sold items, units sold, report date, and opens the iOS share sheet for AirDrop.
                          </ThemedText>
                        </GlassSurface>

                        <Pressable
                          onPress={handleExportRevenue}
                          disabled={isExporting}
                          style={({ pressed }) => [
                            styles.exportButton,
                            {
                              backgroundColor: pressed ? theme.success : theme.tint,
                              opacity: isExporting ? 0.6 : 1,
                              transform: [{ scale: pressed ? 0.98 : 1 }],
                            },
                          ]}>
                          <View style={styles.exportButtonContent}>
                            {Platform.OS === 'ios' ? (
                              <SymbolView
                                name="square.and.arrow.up.fill"
                                size={isTablet ? 24 : 18}
                                tintColor="#FFFFFF"
                              />
                            ) : (
                              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                                PDF
                              </ThemedText>
                            )}
                            <View style={styles.exportButtonTextWrap}>
                              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                                {isExporting ? 'Preparing PDF...' : 'Export Revenue as PDF'}
                              </ThemedText>
                              <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.82)' }}>
                                AirDrop, save to Files, or print
                              </ThemedText>
                            </View>
                          </View>
                          {isExporting ? <ActivityIndicator color="#FFFFFF" /> : null}
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </GlassSurface>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function MetricCard({ label, value, delay }: { label: string; value: string; delay: number }) {
  const theme = useTheme();
  const symbolName =
    label === 'Revenue'
      ? 'dollarsign.circle.fill'
      : label === 'Units Sold'
        ? 'shippingbox.fill'
        : 'list.bullet.rectangle.portrait.fill';

  return (
    <Animated.View entering={FadeInDown.duration(EntranceMotion.item).delay(delay)}>
      <GlassSurface
        style={[styles.metricCard, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
        <View style={styles.utilityLabelRow}>
          <SymbolView name={symbolName} size={15} tintColor={theme.tint} />
          <ThemedText type="small" themeColor="textSecondary">
            {label}
          </ThemedText>
        </View>
        <ThemedText type="sectionTitle">{value}</ThemedText>
      </GlassSurface>
    </Animated.View>
  );
}

function ExportPreviewCard({
  currentDateKey,
  soldItemsCount,
  totalRevenue,
  totalSoldUnits,
}: {
  currentDateKey: string;
  soldItemsCount: number;
  totalRevenue: number;
  totalSoldUnits: number;
}) {
  const theme = useTheme();

  return (
    <GlassSurface
      variant="muted"
      style={[
        styles.exportPreviewCard,
        {
          borderColor: theme.border,
          backgroundColor: theme.surfaceMuted,
        },
      ]}>
      <View style={styles.exportPreviewDoc}>
        <View style={styles.exportPreviewHeader}>
          <View style={styles.utilityLabelRow}>
            <SymbolView name="doc.text.fill" size={15} tintColor={theme.tint} />
            <ThemedText type="smallBold">Revenue Report</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {formatReportDate(currentDateKey)}
          </ThemedText>
        </View>

        <View style={styles.exportPreviewRows}>
          <PreviewInfoRow
            icon="dollarsign.circle.fill"
            label="Revenue total"
            value={`$${totalRevenue.toFixed(2)}`}
          />
          <PreviewInfoRow
            icon="shippingbox.fill"
            label="Units sold"
            value={String(totalSoldUnits)}
          />
          <PreviewInfoRow
            icon="list.bullet.rectangle.portrait.fill"
            label="Items included"
            value={String(soldItemsCount)}
          />
        </View>
      </View>
    </GlassSurface>
  );
}

function PreviewInfoRow({
  icon,
  label,
  value,
}: {
  icon: SFSymbol;
  label: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.previewInfoRow}>
      <View style={styles.utilityLabelRow}>
        <SymbolView name={icon} size={14} tintColor={theme.tint} />
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

function ThemePreviewCard({ currentMode }: { currentMode: 'Light' | 'Dark' }) {
  const theme = useTheme();
  const { isTablet } = useDeviceLayout();

  return (
    <GlassSurface
      variant="muted"
      style={[
        styles.previewCard,
        {
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.previewHeader}>
        <View style={styles.previewHeaderText}>
          <View style={styles.utilityLabelRow}>
            <SymbolView name="rectangle.2.swap" size={15} tintColor={theme.tint} />
            <ThemedText type="smallBold">Theme preview</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Preview the app&apos;s visual tone before switching modes.
          </ThemedText>
        </View>
        <ThemedText type="smallBold" style={{ color: theme.tint }}>
          {currentMode}
        </ThemedText>
      </View>

      <View style={[styles.previewModes, isTablet && styles.previewModesTablet]}>
        <View style={[styles.previewMini, styles.previewMiniLight]}>
          <View style={styles.previewMiniTopBar} />
          <View style={styles.previewMiniCardLight}>
            <View style={styles.previewMiniLineDark} />
            <View style={styles.previewMiniLineMuted} />
            <View style={styles.previewMiniChipLight} />
          </View>
          <ThemedText type="small" style={styles.previewModeLabelLight}>
            Light
          </ThemedText>
        </View>

        <View style={[styles.previewMini, styles.previewMiniDark]}>
          <View style={[styles.previewMiniTopBar, styles.previewMiniTopBarDark]} />
          <View style={styles.previewMiniCardDark}>
            <View style={styles.previewMiniLineLight} />
            <View style={styles.previewMiniLineMutedDark} />
            <View style={styles.previewMiniChipDark} />
          </View>
          <ThemedText type="small" style={styles.previewModeLabelDark}>
            Dark
          </ThemedText>
        </View>
      </View>
    </GlassSurface>
  );
}

function formatReportDate(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`));
}

const styles = StyleSheet.create({
  settingsSection: {
    flexShrink: 0,
  },
  accountCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  accountTab: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accountDetails: {
    borderTopWidth: 1,
    padding: 18,
    gap: 18,
  },
  accountField: {
    gap: 4,
  },
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  contentInner: {
    width: '100%',
    alignSelf: 'center',
    gap: 36,
  },
  quickToggleIntro: {
    flex: 1,
    gap: 4,
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
  previewCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  previewHeader: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  previewHeaderText: {
    flex: 1,
    gap: 4,
  },
  previewModes: {
    flexDirection: 'row',
    gap: 12,
  },
  previewModesTablet: {
    gap: 16,
  },
  previewMini: {
    flex: 1,
    borderRadius: 18,
    padding: 10,
    gap: 10,
    minHeight: 134,
  },
  previewMiniLight: {
    backgroundColor: '#EEF3FA',
    borderWidth: 1,
    borderColor: 'rgba(37, 46, 66, 0.08)',
  },
  previewMiniDark: {
    backgroundColor: '#10141D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewMiniTopBar: {
    height: 10,
    width: '42%',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(22, 28, 45, 0.12)',
  },
  previewMiniTopBarDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  previewMiniCardLight: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    padding: 10,
    gap: 8,
    justifyContent: 'center',
  },
  previewMiniCardDark: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    gap: 8,
    justifyContent: 'center',
  },
  previewMiniLineDark: {
    height: 8,
    width: '58%',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(22, 28, 45, 0.78)',
  },
  previewMiniLineMuted: {
    height: 7,
    width: '78%',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(22, 28, 45, 0.18)',
  },
  previewMiniLineLight: {
    height: 8,
    width: '58%',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
  },
  previewMiniLineMutedDark: {
    height: 7,
    width: '78%',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  previewMiniChipLight: {
    height: 24,
    width: '44%',
    borderRadius: Radius.pill,
    backgroundColor: '#9E7BFF',
  },
  previewMiniChipDark: {
    height: 24,
    width: '44%',
    borderRadius: Radius.pill,
    backgroundColor: '#9E7BFF',
  },
  previewModeLabelLight: {
    color: '#3B4252',
  },
  previewModeLabelDark: {
    color: '#F4F2FF',
  },
  inlineStatus: {
    flexWrap: 'wrap',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metricGrid: {
    gap: 12,
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  exportPreviewCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
  exportPreviewDoc: {
    gap: 14,
  },
  exportPreviewHeader: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  exportPreviewRows: {
    gap: 10,
  },
  previewInfoRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  exportActionRow: {
    gap: 12,
  },
  exportUtilityCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  exportButton: {
    minHeight: 64,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exportButtonTextWrap: {
    gap: 2,
    flex: 1,
  },
});
