import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const LOADING_DURATION_MS = 2200;

type Palette = {
  background: string;
  note: string;
  handle: string;
  body: string;
  bodyBorder: string;
  eye: string;
  pupil: string;
  smile: string;
  cheek: string;
  tag: string;
  foot: string;
  shadow: string;
  track: string;
  pulse: string;
  text: string;
};

const LIGHT_PALETTE: Palette = {
  background: '#FFFFFF',
  note: '#B8E0FF',
  handle: '#2FA7D9',
  body: '#2FD5C8',
  bodyBorder: '#16B8AE',
  eye: '#FFFFFF',
  pupil: '#24333A',
  smile: '#0F8D85',
  cheek: '#79E6DF',
  tag: '#FFD16A',
  foot: '#FF9F0A',
  shadow: '#27313D',
  track: '#E5E3E3',
  pulse: '#D6D2D2',
  text: '#BAB7B5',
};

const DARK_PALETTE: Palette = {
  background: '#111317',
  note: '#8ED4FF',
  handle: '#80CDEB',
  body: '#28C9BC',
  bodyBorder: '#159A90',
  eye: '#F7FAFC',
  pupil: '#1A242C',
  smile: '#D2FFF9',
  cheek: '#7CE3DB',
  tag: '#FFC85C',
  foot: '#F7A11C',
  shadow: '#05070A',
  track: '#2B3037',
  pulse: '#49515B',
  text: '#7B828B',
};

export function AppLoadingScreen() {
  const { isTablet } = useDeviceLayout();
  const scheme = useColorScheme();
  const [mounted, setMounted] = useState(true);
  const bounce = useSharedValue(0);
  const sway = useSharedValue(0);
  const noteFloat = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);
  const overlayScale = useSharedValue(1);
  const palette = scheme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 380,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(0, {
          duration: 380,
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      false
    );

    sway.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 620,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(-1, {
          duration: 620,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: 620,
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      false
    );

    noteFloat.value = withRepeat(
      withTiming(1, {
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );

    const fadeTimeout = setTimeout(() => {
      overlayOpacity.value = withTiming(0, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
      overlayScale.value = withTiming(1.012, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
    }, LOADING_DURATION_MS);

    const unmountTimeout = setTimeout(() => {
      setMounted(false);
    }, LOADING_DURATION_MS + 340);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(unmountTimeout);
    };
  }, [bounce, noteFloat, overlayOpacity, overlayScale, sway]);

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(bounce.value, [0, 1], [0, -10]) },
      { rotateZ: `${interpolate(sway.value, [-1, 1], [-8, 8])}deg` },
      { scale: interpolate(bounce.value, [0, 1], [1, 1.02]) },
    ],
  }));

  const armAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${interpolate(sway.value, [-1, 1], [14, -16])}deg` }],
  }));

  const oppositeArmAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${interpolate(sway.value, [-1, 1], [-10, 12])}deg` }],
  }));

  const leftFootAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(bounce.value, [0, 1], [0, -2]) },
      { rotateZ: `${interpolate(sway.value, [-1, 1], [-18, 18])}deg` },
    ],
  }));

  const rightFootAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(bounce.value, [0, 1], [-2, 0]) },
      { rotateZ: `${interpolate(sway.value, [-1, 1], [18, -18])}deg` },
    ],
  }));

  const firstNoteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(noteFloat.value, [0, 1], [0.65, 1]),
    transform: [
      { translateY: interpolate(noteFloat.value, [0, 1], [6, -16]) },
      { translateX: interpolate(noteFloat.value, [0, 1], [-2, 4]) },
      { scale: interpolate(noteFloat.value, [0, 1], [0.92, 1.08]) },
    ],
  }));

  const secondNoteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(noteFloat.value, [0, 1], [1, 0.55]),
    transform: [
      { translateY: interpolate(noteFloat.value, [0, 1], [0, -12]) },
      { translateX: interpolate(noteFloat.value, [0, 1], [2, 10]) },
      { scale: interpolate(noteFloat.value, [0, 1], [1, 0.9]) },
    ],
  }));

  const shadowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(bounce.value, [0, 1], [1, 0.82]) }],
    opacity: interpolate(bounce.value, [0, 1], [0.16, 0.1]),
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));

  if (!mounted) {
    return null;
  }

  const mascotScale = isTablet ? 1.32 : 1.18;
  const noteSize = isTablet ? 24 : 19;

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.overlay, overlayAnimatedStyle, { backgroundColor: palette.background }]}>
      <View style={styles.centerWrap}>
        <View
          style={[
            styles.scene,
            {
              transform: [{ scale: mascotScale }],
            },
          ]}>
          <Animated.View style={[styles.noteWrap, styles.notePrimary, firstNoteAnimatedStyle]}>
            <SymbolView name="music.note" size={noteSize} tintColor={palette.note} />
          </Animated.View>

          <Animated.View style={[styles.noteWrap, styles.noteSecondary, secondNoteAnimatedStyle]}>
            <SymbolView name="music.note" size={noteSize + 4} tintColor={palette.note} />
          </Animated.View>

          <Animated.View style={[styles.mascotWrap, mascotAnimatedStyle]}>
            <View style={[styles.handle, { borderColor: palette.handle }]} />

            <Animated.View
              style={[
                styles.armLeft,
                armAnimatedStyle,
                { backgroundColor: palette.body, borderColor: palette.bodyBorder },
              ]}
            />
            <Animated.View
              style={[
                styles.armRight,
                oppositeArmAnimatedStyle,
                { backgroundColor: palette.body, borderColor: palette.bodyBorder },
              ]}
            />

            <View
              style={[
                styles.body,
                { backgroundColor: palette.body, borderColor: palette.bodyBorder },
              ]}>
              <View style={styles.faceRow}>
                <View style={[styles.eye, { backgroundColor: palette.eye }]}>
                  <View style={[styles.pupil, { backgroundColor: palette.pupil }]} />
                </View>
                <View style={[styles.eye, { backgroundColor: palette.eye }]}>
                  <View style={[styles.pupil, { backgroundColor: palette.pupil }]} />
                </View>
              </View>

              <View style={[styles.smile, { borderColor: palette.smile }]} />
              <View style={[styles.cheekLeft, { backgroundColor: palette.cheek }]} />
              <View style={[styles.cheekRight, { backgroundColor: palette.cheek }]} />
              <View style={[styles.tag, { backgroundColor: palette.tag }]} />
            </View>

            <Animated.View
              style={[styles.footLeft, leftFootAnimatedStyle, { backgroundColor: palette.foot }]}
            />
            <Animated.View
              style={[
                styles.footRight,
                rightFootAnimatedStyle,
                { backgroundColor: palette.foot },
              ]}
            />
          </Animated.View>

          <Animated.View
            style={[styles.shadow, shadowAnimatedStyle, { backgroundColor: palette.shadow }]}
          />

          <View style={styles.loadingWrap}>
            <View style={[styles.loadingTrack, { backgroundColor: palette.track }]}>
              <Animated.View
                style={[
                  styles.loadingPulse,
                  {
                    backgroundColor: palette.pulse,
                    transform: [{ translateX: interpolate(noteFloat.value, [0, 1], [-14, 14]) }],
                  },
                ]}
              />
            </View>
            <View style={styles.loadingTextRow}>
              {'LOADING...'.split('').map((letter, index) => (
                <LoadingLetter key={`${letter}-${index}`} color={palette.text} index={index} letter={letter} />
              ))}
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function LoadingLetter({
  letter,
  index,
  color,
}: {
  letter: string;
  index: number;
  color: string;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withDelay(
        index * 70,
        withSequence(
          withTiming(1, {
            duration: 420,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0, {
            duration: 420,
            easing: Easing.inOut(Easing.quad),
          })
        )
      ),
      -1,
      false
    );
  }, [index, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.48, 0.9]),
    transform: [{ translateY: interpolate(pulse.value, [0, 1], [0, -1.5]) }],
  }));

  return (
    <Animated.Text style={[styles.loadingText, animatedStyle, { color }]}>
      {letter}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scene: {
    width: 212,
    alignItems: 'center',
  },
  noteWrap: {
    position: 'absolute',
    zIndex: 5,
  },
  notePrimary: {
    right: 54,
    top: -28,
  },
  noteSecondary: {
    right: 22,
    top: -14,
  },
  mascotWrap: {
    width: 132,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  handle: {
    width: 34,
    height: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 6,
    borderBottomWidth: 0,
    marginBottom: -2,
    zIndex: 2,
  },
  body: {
    width: 100,
    height: 112,
    borderRadius: 26,
    borderWidth: 6,
    alignItems: 'center',
    paddingTop: 24,
    position: 'relative',
    zIndex: 3,
  },
  armLeft: {
    position: 'absolute',
    left: 5,
    top: 42,
    width: 28,
    height: 50,
    borderRadius: 18,
    borderWidth: 5,
    zIndex: 1,
  },
  armRight: {
    position: 'absolute',
    right: 5,
    top: 42,
    width: 28,
    height: 50,
    borderRadius: 18,
    borderWidth: 5,
    zIndex: 1,
  },
  faceRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  eye: {
    width: 21,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 9,
    height: 9,
    borderRadius: Radius.pill,
  },
  smile: {
    width: 30,
    height: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderBottomWidth: 5,
  },
  cheekLeft: {
    position: 'absolute',
    left: 16,
    top: 54,
    width: 12,
    height: 12,
    borderRadius: Radius.pill,
    opacity: 0.8,
  },
  cheekRight: {
    position: 'absolute',
    right: 16,
    top: 54,
    width: 12,
    height: 12,
    borderRadius: Radius.pill,
    opacity: 0.8,
  },
  tag: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 14,
    height: 22,
    borderRadius: 6,
    transform: [{ rotate: '14deg' }],
  },
  footLeft: {
    position: 'absolute',
    left: 32,
    bottom: -14,
    width: 24,
    height: 12,
    borderRadius: 12,
  },
  footRight: {
    position: 'absolute',
    right: 32,
    bottom: -14,
    width: 24,
    height: 12,
    borderRadius: 12,
  },
  shadow: {
    width: 68,
    height: 10,
    borderRadius: Radius.pill,
    marginTop: 12,
  },
  loadingWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  loadingTrack: {
    width: 88,
    height: 7,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loadingPulse: {
    width: 40,
    height: 7,
    borderRadius: Radius.pill,
  },
  loadingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0.5,
  },
  loadingText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    fontFamily: Fonts.sansExtraBold,
    letterSpacing: 0.7,
  },
});
