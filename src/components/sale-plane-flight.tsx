import { useEffect, useState } from 'react';
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

const PLANE_PIXELS = [
  '        WW              ',
  '        WWW             ',
  '         WWW            ',
  '  W      WWWW           ',
  '  WW     WWWWW          ',
  '  WWWWWWWWWWWWWWW       ',
  'FFWWWWWWWWWWWWCCCWW     ',
  'FFWWWWWWWWWWWWWWWWWWW   ',
  '  TTTTTTTTTTTTTTTTT     ',
  '  TT     TTTTT          ',
  '  T      TTTT           ',
  '         TTT            ',
  '        TTT             ',
  '        TT              ',
];

const PIXEL_COLORS: Record<string, string> = {
  W: '#F4FAFF',
  T: '#22A6A1',
  C: '#176686',
  F: '#FFC857',
};

export function SalePlaneFlight({
  flightId,
  onComplete,
}: {
  flightId: number;
  onComplete: (id: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (width === 0) {
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, {
      duration: reducedMotion ? 1000 : 2200,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.Never,
    }, (finished) => {
      if (finished) {
        runOnJS(onComplete)(flightId);
      }
    });

    return () => cancelAnimation(progress);
  }, [flightId, onComplete, progress, reducedMotion, width]);

  const flightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.85, 1], [0, 1, 1, 0]),
    transform: reducedMotion ? [] : [
      { translateX: interpolate(progress.value, [0, 1], [-180, width + 180]) },
      { translateY: interpolate(progress.value, [0, 0.3, 0.65, 1], [60, 18, 28, -12]) },
      { rotate: `${interpolate(progress.value, [0, 0.3, 0.65, 1], [-12, 0, -4, -18])}deg` },
    ],
  }));

  const exhaustStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + Math.sin(progress.value * 90) * 0.25,
    transform: [{ scaleX: 0.85 + Math.sin(progress.value * 110) * 0.15 }],
  }));

  return (
    <View
      pointerEvents="none"
      style={styles.flightArea}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Animated.View
        testID="sale-plane-flight"
        accessible
        accessibilityRole="image"
        accessibilityLabel="Sale recorded. Plane celebration."
        style={[styles.flight, reducedMotion && styles.reducedFlight, flightStyle]}>
        {!reducedMotion ? (
          <View style={styles.aircraft}>
            <Animated.View style={[styles.exhaust, exhaustStyle]}>
              <View style={[styles.streak, styles.streakTop]} />
              <View style={styles.streak} />
              <View style={[styles.streak, styles.streakBottom]} />
            </Animated.View>
            <View style={styles.plane}>
              {PLANE_PIXELS.flatMap((row, rowIndex) =>
                [...row].flatMap((pixel, columnIndex) => pixel === ' ' ? [] : [
                  <View
                    key={`${rowIndex}-${columnIndex}`}
                    style={[
                      styles.pixel,
                      { top: rowIndex * 4, left: columnIndex * 4, backgroundColor: PIXEL_COLORS[pixel] },
                    ]}
                  />,
                ])
              )}
            </View>
          </View>
        ) : null}
        <View style={styles.saleBadge}>
          <ThemedText type="smallBold" style={styles.saleText}>+1 SALE</ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flightArea: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 150,
    overflow: 'hidden',
    zIndex: 20,
  },
  flight: {
    position: 'absolute',
    width: 160,
    height: 100,
    alignItems: 'center',
  },
  reducedFlight: {
    right: 18,
    top: 8,
    alignItems: 'flex-end',
  },
  aircraft: {
    width: 160,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  plane: {
    width: 96,
    height: 56,
    shadowColor: '#176686',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pixel: {
    position: 'absolute',
    width: 4,
    height: 4,
  },
  exhaust: {
    width: 64,
    gap: 5,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  streak: {
    height: 3,
    width: 56,
    backgroundColor: '#FFC857',
  },
  streakTop: {
    width: 34,
    backgroundColor: '#22A6A1',
  },
  streakBottom: {
    width: 42,
    backgroundColor: '#22A6A1',
  },
  saleBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#22A6A1',
    backgroundColor: '#123B3A',
  },
  saleText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
});