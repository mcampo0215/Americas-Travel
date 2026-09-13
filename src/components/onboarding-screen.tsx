import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { cancelAnimation, Easing, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

const CHAPTERS = [
  { label: 'READY FOR TAKEOFF', title: 'Americas\nTravel.', subtitle: 'A new day. A world of possibility.', accent: '#B9F5DD', origin: 'TODAY', destination: 'WHAT\'S NEXT', number: '01' },
  { label: 'FIND YOUR MOMENTUM', title: 'Small wins.\nNew heights.', subtitle: 'Make every moment count.', accent: '#FFE28C', origin: 'ONE SALE', destination: 'MOMENTUM', number: '02' },
  { label: 'MAKE IT YOURS', title: 'Your next\nchapter.', subtitle: 'Great days begin with you.', accent: '#BDE8FF', origin: 'YOUR TEAM', destination: 'POSSIBILITY', number: '03' },
];

export function OnboardingScreen({ onAccount }: { onAccount: (mode: 'login' | 'signup') => void }) {
  const [step, setStep] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const chapter = CHAPTERS[step];

  useEffect(() => {
    progress.value = 0;
    if (!reducedMotion) {
      progress.value = withRepeat(withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }), -1, true);
    }
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion, step]);

  const photoMotion = useAnimatedStyle(() => ({
    transform: [{ scale: 1.04 + progress.value * 0.06 }, { translateX: progress.value * -10 }],
  }));
  const planeMotion = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - 0.5) * Math.min(width * 0.4, 300) }, { translateY: -progress.value * 24 }, { rotate: '45deg' }],
  }));
  const wide = width >= 768;
  const compact = height < 700;

  return (
    <View testID="onboarding-screen" style={styles.screen}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { bottom: wide ? 130 : 175 }, photoMotion]}>
        <Image
          source={require('../../assets/images/onboarding-flight.jpg')}
          contentFit="cover"
          contentPosition="right center"
          accessibilityLabel="Airplane wing above sunlit clouds"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View pointerEvents="none" style={styles.photoTint} />
      <SafeAreaView style={styles.safe}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { minHeight: height - insets.top - insets.bottom, paddingHorizontal: wide ? 56 : 24 }]}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <SymbolView name={{ ios: 'airplane', android: 'flight', web: 'flight' }} size={24} tintColor="#FFFFFF" />
              <ThemedText style={styles.brandText}>AMERICAS TRAVEL</ThemedText>
            </View>
            <Pressable accessibilityRole="button" onPress={() => onAccount('login')} style={styles.login}>
              <ThemedText style={styles.loginText}>Log in</ThemedText>
              <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} size={16} tintColor="#FFFFFF" />
            </Pressable>
          </View>

          <Animated.View key={step} entering={reducedMotion ? undefined : FadeInDown.duration(550)} style={[styles.copy, compact && styles.copyCompact]}>
            <View style={styles.chapterLine}>
              <View style={[styles.chapterDash, { backgroundColor: chapter.accent }]} />
              <ThemedText style={[styles.eyebrow, { color: chapter.accent }]}>{chapter.label}</ThemedText>
            </View>
            <ThemedText accessibilityRole="header" style={[styles.title, wide && styles.titleWide, compact && styles.titleCompact]}>{chapter.title}</ThemedText>
            <ThemedText style={styles.subtitle}>{chapter.subtitle}</ThemedText>
          </Animated.View>

          <View style={[styles.openSky, { minHeight: compact ? 40 : 160 }]}>
            <View pointerEvents="none" style={styles.flightLine} />
            <Animated.View testID="onboarding-plane" pointerEvents="none" style={[styles.plane, planeMotion]}>
              <SymbolView name={{ ios: 'airplane', android: 'flight', web: 'flight' }} size={44} tintColor={chapter.accent} />
            </Animated.View>
          </View>

          <View style={[styles.footer, { marginHorizontal: wide ? -56 : -24, paddingHorizontal: wide ? 56 : 24 }]}>
            <View style={styles.route}>
              <ThemedText style={styles.routeText}>{chapter.origin}</ThemedText>
              <View style={styles.routeRule} />
              <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={16} tintColor={chapter.accent} />
              <ThemedText style={styles.routeText}>{chapter.destination}</ThemedText>
            </View>
            <View style={[styles.footerMain, wide && styles.footerMainWide]}>
              <View style={styles.progress}>
                <ThemedText style={[styles.pageNumber, { color: chapter.accent }]}>{chapter.number}<ThemedText style={styles.pageTotal}> / 03</ThemedText></ThemedText>
                <View style={styles.steps}>
                  {CHAPTERS.map((entry, index) => (
                    <Pressable key={entry.number} accessibilityRole="button" accessibilityLabel={`Welcome step ${index + 1}`} accessibilityState={{ selected: index === step }} onPress={() => setStep(index)} style={styles.stepTarget}>
                      <View style={[styles.stepLine, { backgroundColor: index === step ? chapter.accent : '#64776F' }]} />
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={[styles.actions, wide && styles.actionsWide]}>
                <Pressable accessibilityRole="button" onPress={() => step === 0 ? onAccount('login') : setStep(step - 1)} style={styles.back}>
                  <ThemedText style={styles.backText}>{step === 0 ? 'Skip' : 'Back'}</ThemedText>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => step === 2 ? onAccount('signup') : setStep(step + 1)} style={({ pressed }) => [styles.continue, { backgroundColor: chapter.accent, opacity: pressed ? 0.8 : 1 }]}>
                  <ThemedText style={styles.continueText}>{step === 2 ? 'Get started' : 'Continue'}</ThemedText>
                  <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={21} tintColor="#102B23" />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#24483E', overflow: 'hidden' },
  photoTint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 27, 24, 0.36)' },
  safe: { flex: 1 },
  content: { flexGrow: 1, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { color: '#FFFFFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  login: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22, fontWeight: '600' },
  copy: { paddingTop: 38, gap: 16 },
  copyCompact: { paddingTop: 20, gap: 12 },
  chapterLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chapterDash: { width: 24, height: 2 },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 11, lineHeight: 18 },
  title: { fontSize: 52, lineHeight: 58, fontWeight: '800', letterSpacing: 0, color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 16 },
  titleWide: { fontSize: 80, lineHeight: 86 },
  titleCompact: { fontSize: 44, lineHeight: 50 },
  subtitle: { color: '#FFFFFF', fontSize: 17, lineHeight: 26, maxWidth: 420 },
  openSky: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  flightLine: { position: 'absolute', left: '10%', right: '10%', borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.6)', transform: [{ rotate: '-8deg' }] },
  plane: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  footer: { backgroundColor: '#102B23', paddingTop: 20, paddingBottom: 28, gap: 14 },
  route: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeText: { fontFamily: Fonts.mono, color: '#D6E5DD', fontSize: 10, lineHeight: 18 },
  routeRule: { height: 1, backgroundColor: '#486056', flex: 1 },
  footerMain: { gap: 8 },
  footerMainWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  pageNumber: { fontFamily: Fonts.mono, fontSize: 26, lineHeight: 36 },
  pageTotal: { color: '#99B1A5', fontSize: 13, lineHeight: 20 },
  steps: { flexDirection: 'row', gap: 4 },
  stepTarget: { width: 44, height: 44, justifyContent: 'center' },
  stepLine: { height: 3, borderRadius: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionsWide: { width: 350 },
  back: { minWidth: 44, minHeight: 56, justifyContent: 'center' },
  backText: { color: '#D6E5DD', fontSize: 15, lineHeight: 22 },
  continue: { minHeight: 56, flex: 1, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  continueText: { color: '#102B23', fontSize: 16, lineHeight: 24, fontWeight: '700' },
});