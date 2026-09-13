import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';

export function SaleMoneyBurst({
  id,
  amount,
  onComplete,
}: {
  id: number;
  amount: number;
  onComplete: (id: number) => void;
}) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: reducedMotion ? 1100 : 1400,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.Never,
    }, (finished) => {
      if (finished) {
        runOnJS(onComplete)(id);
      }
    });
    return () => cancelAnimation(progress);
  }, [id, onComplete, progress, reducedMotion]);

  const burstStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.7, 1], [0, 1, 1, 0]),
    transform: reducedMotion ? [] : [
      { translateY: interpolate(progress.value, [0, 1], [12, -64]) },
      { translateX: interpolate(progress.value, [0, 1], [0, -(id % 3) * 16]) },
      { scale: interpolate(progress.value, [0, 0.15, 0.3, 1], [0.7, 1.12, 1, 1]) },
    ],
  }));

  const coinStyle = useAnimatedStyle(() => ({
    transform: reducedMotion ? [] : [
      { rotate: `${interpolate(progress.value, [0, 1], [-25, 25])}deg` },
      { translateY: -Math.sin(progress.value * Math.PI) * 8 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      testID="sale-money-burst"
      accessible
      accessibilityLabel={`Sale recorded: $${amount.toFixed(2)}`}
      style={[styles.burst, burstStyle]}>
      <Animated.View style={[styles.coin, coinStyle]}>
        <ThemedText style={styles.coinText}>$</ThemedText>
      </Animated.View>
      <View style={styles.amountShell}>
        <ThemedText type="smallBold" style={styles.amount}>+${amount.toFixed(2)}</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  burst: {
    position: 'absolute',
    right: 0,
    bottom: 42,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  coin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#D99B18',
    backgroundColor: '#FFD76A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    color: '#754600',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  amountShell: {
    flexShrink: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#79E5B0',
    backgroundColor: '#123F30',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  amount: {
    color: '#B9FFD9',
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
});