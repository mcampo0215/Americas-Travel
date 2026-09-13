import { useEffect } from 'react';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useInventoryStore } from '@/providers/inventory-store';

const CELEBRATIONS = [
  { label: 'STAR PLAYER', accent: '#85E9CE', background: '#173E35', symbol: { ios: 'star.fill', android: 'star', web: 'star' }, duration: 2400 },
  { label: 'ON A ROLL', accent: '#FFE078', background: '#343047', symbol: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' }, duration: 2500 },
  { label: 'GOLD RUSH', accent: '#FFD76A', background: '#40351C', symbol: { ios: 'dollarsign.circle.fill', android: 'paid', web: 'paid' }, duration: 3000 },
  { label: 'CENTURY CLUB', accent: '#FFA8C9', background: '#40233A', symbol: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }, duration: 3200 },
  { label: 'RECORD RUN', accent: '#91DDFF', background: '#183C48', symbol: { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' }, duration: 3200 },
] as const;

function getCelebrationVariant(milestone: number) {
  return milestone === 10 ? 0 : milestone === 25 ? 1 : milestone === 50 ? 2 : milestone === 100 ? 3 : 4;
}

export function SaleMilestoneCelebration() {
  const { saleMilestones, completeSaleMilestone, currentDateKey } = useInventoryStore();
  const milestone = saleMilestones.pending[0];

  if (milestone === undefined || saleMilestones.dateKey !== currentDateKey) {
    return null;
  }

  return (
    <MilestoneBurst
      key={`${saleMilestones.dateKey}-${milestone}`}
      milestone={milestone}
      dateKey={saleMilestones.dateKey}
      onComplete={completeSaleMilestone}
    />
  );
}

function MilestoneBurst({ milestone, dateKey, onComplete }: {
  milestone: number;
  dateKey: string;
  onComplete: (dateKey: string, milestone: number) => void;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const variant = getCelebrationVariant(milestone);
  const celebration = CELEBRATIONS[variant];
  const particleCount = variant === 0 ? 12 : variant === 1 ? 14 : variant === 2 ? 18 : 24;

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: celebration.duration,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.Never,
    }, (finished) => {
      if (finished) {
        runOnJS(onComplete)(dateKey, milestone);
      }
    });
    return () => cancelAnimation(progress);
  }, [celebration.duration, dateKey, milestone, onComplete, progress]);

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.82, 1], [0, 1, 1, 0]),
    transform: reducedMotion ? [] : [
      { translateX: variant === 1 ? interpolate(progress.value, [0, 0.12, 0.82, 1], [-100, 0, 0, 100]) : 0 },
      { translateY: interpolate(progress.value, [0, 0.12, 0.82, 1], [variant === 2 ? 30 : -28, 0, 0, -12]) },
      { scale: interpolate(progress.value, [0, 0.1, 0.18, 1], [variant === 3 ? 0.6 : 0.85, 1.04, 1, 1]) },
    ],
  }));

  const emblemStyle = useAnimatedStyle(() => ({
    transform: reducedMotion ? [] : [
      { rotate: `${variant === 0 ? interpolate(progress.value, [0, 0.25, 1], [-90, 0, 0]) : variant === 2 ? Math.sin(progress.value * Math.PI * 4) * 18 : variant === 4 ? Math.sin(progress.value * Math.PI * 2) * 12 : 0}deg` },
      { scale: variant === 1 || variant === 3 ? 1 + Math.sin(progress.value * Math.PI * 4) * 0.12 : 1 },
    ],
  }));

  return (
    <SafeAreaView pointerEvents="none" edges={['top', 'left', 'right']} style={styles.overlay}>
      <View pointerEvents="none" style={styles.stage}>
        {!reducedMotion ? Array.from({ length: particleCount }, (_, index) => (
          <CelebrationParticle key={index} index={index} progress={progress} variant={variant} milestone={milestone} />
        )) : null}
        <Animated.View
          testID="sale-milestone-celebration"
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${milestone} sales today. Milestone reached!`}
          style={[styles.banner, { borderColor: celebration.accent, backgroundColor: celebration.background }, bannerStyle]}>
          <Animated.View style={[styles.trophyShell, emblemStyle]}>
            <SymbolView
              name={celebration.symbol}
              size={28}
              tintColor={celebration.accent}
            />
          </Animated.View>
          <View style={styles.textWrap}>
            <ThemedText type="smallBold" style={[styles.eyebrow, { color: celebration.accent }]}>{celebration.label}</ThemedText>
            <ThemedText type="smallBold" style={styles.title}>{milestone} sales today!</ThemedText>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function CelebrationParticle({ index, progress, variant, milestone }: {
  index: number;
  progress: SharedValue<number>;
  variant: number;
  milestone: number;
}) {
  const particleStyle = useAnimatedStyle(() => {
    const delay = variant === 2 ? (index % 6) * 0.035 : variant === 3 ? Math.floor(index / 8) * 0.13 : 0;
    const travel = Math.max(0, Math.min(1, (progress.value - delay) / 0.7));
    const direction = index % 2 === 0 ? -1 : 1;
    const angle = index * Math.PI * 2 / (variant === 0 ? 12 : 8);
    let horizontal = 0;
    let vertical = 0;
    if (variant === 0) {
      horizontal = Math.cos(angle) * 130 * travel;
      vertical = Math.sin(angle) * 95 * travel + 65 * travel * travel;
    } else if (variant === 1) {
      horizontal = -150 + 300 * travel;
      vertical = (index - 7) * 15 + Math.sin(travel * Math.PI) * 10;
    } else if (variant === 2) {
      horizontal = (index % 9 - 4) * 30 + Math.sin(travel * Math.PI) * direction * 12;
      vertical = -80 + travel * travel * 270;
    } else if (variant === 3) {
      horizontal = (Math.floor(index / 8) - 1) * 80 + Math.cos(angle) * 65 * travel;
      vertical = 65 + Math.sin(angle) * 65 * travel + 70 * travel * travel;
    } else {
      const orbit = angle + travel * Math.PI * (2 + milestone / 250);
      horizontal = Math.cos(orbit) * (35 + travel * 110);
      vertical = 30 + Math.sin(orbit) * (25 + travel * 50) + travel * 50;
    }
    return {
      opacity: interpolate(travel, [0, 0.08, 0.65, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: horizontal },
        { translateY: vertical },
        { rotate: `${variant === 1 ? -15 : index * 25 + travel * direction * 180}deg` },
      ],
    };
  });

  const accent = CELEBRATIONS[variant].accent;
  return <Animated.View testID="milestone-particle" style={[
    styles.particle,
    variant === 1 ? styles.streak : variant === 2 ? styles.coin : variant === 0 ? styles.star : styles.spark,
    { backgroundColor: index % 3 === 0 ? '#F5FAFF' : accent },
    particleStyle,
  ]}>
    {variant === 2 ? <ThemedText style={styles.coinText}>$</ThemedText> : null}
  </Animated.View>;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  stage: {
    height: 240,
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    maxWidth: 340,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD76A',
    backgroundColor: '#173E35',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  trophyShell: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 5,
  },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#FFD76A',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: '#F5FAFF',
  },
  particle: {
    position: 'absolute',
    top: 55,
    left: '50%',
  },
  spark: {
    width: 6,
    height: 10,
    borderRadius: 1,
  },
  star: {
    width: 9,
    height: 9,
    borderRadius: 1,
  },
  streak: {
    width: 24,
    height: 3,
    borderRadius: 1,
  },
  coin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#BD8519',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: '#62430C',
  },
});