import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import Animated, { cancelAnimation, Easing, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { Fonts } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { auth } from '@/lib/auth';
import { registerAccount } from '@/lib/register-account';
import { useAuthSession } from '@/providers/auth-session';

type AccountMode = 'login' | 'signup' | 'reset';

const ACCOUNT_COLORS = {
  background: '#102B23',
  text: '#F5FAF7',
  textSecondary: '#C4D8CD',
  textMuted: '#99B3A5',
  surfaceElevated: '#1B3B30',
  border: '#426354',
  tint: '#B9F5DD',
  danger: '#FFB4AF',
};

function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'That email and password did not match. Please try again.';
    case 'auth/email-already-in-use': return 'An account already uses this email. Log in or reset your password.';
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements': return 'Choose a stronger password with uppercase, lowercase, numbers, and a symbol.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a little before trying again.';
    case 'auth/network-request-failed': return 'Unable to connect. Check your internet connection and try again.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found': return 'Email sign-in is not enabled yet. Contact your workspace administrator.';
    case 'auth/user-disabled': return 'This account is disabled. Contact your workspace administrator.';
    default: return 'We could not complete that request. Please try again.';
  }
}

export function WelcomeFlow() {
  const { onboarded, completeOnboarding } = useAuthSession();
  const [mode, setMode] = useState<AccountMode>('login');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { height, isTablet: wide } = useDeviceLayout();
  const reducedMotion = useReducedMotion();
  const compact = height < 750;

  async function openAccount(nextMode: AccountMode) {
    setMode(nextMode);
    await completeOnboarding();
  }

  if (!onboarded) {
    return <OnboardingScreen onAccount={(nextMode) => void openAccount(nextMode)} />;
  }

  return (
    <View testID="account-screen" style={styles.screen}>
      <AccountBackdrop />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.shell}>
            <View style={[styles.photoSection, { paddingHorizontal: wide ? 56 : 24 }, compact && styles.photoSectionCompact]}>
              <View style={styles.brandRow}>
                <SymbolView name={{ ios: 'airplane', android: 'flight', web: 'flight' }} size={24} tintColor="#FFFFFF" />
                <ThemedText type="smallBold" style={styles.brand}>AMERICAS TRAVEL</ThemedText>
                <SymbolView name={{ ios: 'lock.shield', android: 'shield', web: 'shield' }} size={20} tintColor="#B9F5DD" />
              </View>
              <Animated.View key={mode} entering={reducedMotion ? undefined : FadeInDown.duration(450)} style={styles.formHeading}>
                <View style={styles.chapterLine}>
                  <View style={styles.chapterDash} />
                  <ThemedText style={styles.eyebrow}>{mode === 'reset' ? 'ACCOUNT RECOVERY' : mode === 'signup' ? 'YOUR JOURNEY STARTS HERE' : 'YOUR DAILY DEPARTURE'}</ThemedText>
                </View>
                <ThemedText accessibilityRole="header" style={[styles.formTitle, wide && styles.formTitleWide, compact && styles.formTitleCompact]}>{mode === 'reset' ? 'A fresh\nstart.' : mode === 'signup' ? 'Come\naboard.' : 'Welcome\nback.'}</ThemedText>
                <ThemedText style={styles.subtitle}>{mode === 'reset' ? 'Reset your password. Pick up where you left off.' : mode === 'signup' ? 'Your next chapter starts today.' : 'A new day. New possibilities.'}</ThemedText>
              </Animated.View>
            </View>
            <View style={[styles.formBand, { paddingHorizontal: wide ? 56 : 24 }]}>
              <AccountForm key={mode} mode={mode} initialEmail={registeredEmail}
                initialNotice={mode === 'login' && registeredEmail ? 'Account created. Log in with your email and password to continue.' : ''}
                onModeChange={(nextMode) => { setRegisteredEmail(''); setMode(nextMode); }}
                onRegistered={(email) => { setRegisteredEmail(email); setMode('login'); }} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea} />
    </View>
  );
}

function AccountBackdrop() {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!reducedMotion) progress.value = withRepeat(withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion]);
  const motion = useAnimatedStyle(() => ({ transform: [
    { scale: 1.04 + progress.value * 0.06 },
    { translateX: progress.value * -10 },
  ] }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View testID="account-backdrop" style={[StyleSheet.absoluteFill, motion]}>
        <Image source={require('../../assets/images/onboarding-flight.jpg')} contentFit="cover" contentPosition="right top" accessibilityLabel="Airplane wing above sunlit clouds" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={styles.photoTint} />
    </View>
  );
}

function AccountForm({ mode, onModeChange, initialEmail, initialNotice, onRegistered }: {
  mode: AccountMode;
  onModeChange: (mode: AccountMode) => void;
  initialEmail: string;
  initialNotice: string;
  onRegistered: (email: string) => void;
}) {
  const theme = ACCOUNT_COLORS;
  const reducedMotion = useReducedMotion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialNotice);
  const submitting = useRef(false);
  const signup = mode === 'signup';
  const reset = mode === 'reset';

  async function submit() {
    if (submitting.current) return;
    setError('');
    setNotice('');
    if (signup && !name.trim()) { setError('Enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (!reset && !password) { setError('Enter your password.'); return; }
    if (signup && password.length < 8) { setError('Use at least 8 characters for your password.'); return; }
    submitting.current = true;
    setBusy(true);
    try {
      if (reset) {
        await sendPasswordResetEmail(auth, email.trim());
        setNotice('If an account exists for this email, a reset link is on its way. Check your inbox and spam folder.');
      } else if (signup) {
        await registerAccount(email.trim(), password, name.trim());
        onRegistered(email.trim());
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (failure) { setError(authErrorMessage(failure)); }
    finally { submitting.current = false; setBusy(false); }
  }

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(350)} style={styles.form}>
      <View style={styles.formSectionHeader}>
        <ThemedText style={styles.formSectionTitle}>{reset ? 'PASSWORD RECOVERY' : signup ? 'CREATE YOUR ACCOUNT' : 'YOUR ACCOUNT'}</ThemedText>
        <View style={styles.sectionRule} />
        <SymbolView name={{ ios: reset ? 'envelope' : 'person.crop.circle', android: reset ? 'mail' : 'account_circle', web: reset ? 'mail' : 'account_circle' }} size={20} tintColor={theme.tint} />
      </View>
      {signup ? <View style={styles.field}>
        <ThemedText type="smallBold" style={styles.label}>Full name</ThemedText>
        <TextInput accessibilityLabel="Full name" autoComplete="name" textContentType="name" value={name} onChangeText={setName} editable={!busy} placeholder="Your name" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.textMuted }]} />
      </View> : null}
      <View style={styles.field}>
        <ThemedText type="smallBold" style={styles.label}>Email address</ThemedText>
        <TextInput accessibilityLabel="Email address" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} editable={!busy} placeholder="you@example.com" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.textMuted }]} onSubmitEditing={reset ? () => void submit() : undefined} />
      </View>
      {!reset ? <View style={styles.field}>
        <ThemedText type="smallBold" style={styles.label}>Password</ThemedText>
        <View style={[styles.passwordShell, { backgroundColor: theme.surfaceElevated, borderColor: theme.textMuted }]}>
          <TextInput accessibilityLabel="Password" autoComplete={signup ? 'new-password' : 'current-password'} textContentType={signup ? 'newPassword' : 'password'} secureTextEntry={!visiblePassword} autoCapitalize="none" autoCorrect={false} value={password} onChangeText={setPassword} editable={!busy} placeholder={signup ? 'At least 8 characters' : 'Your password'} placeholderTextColor={theme.textMuted} style={[styles.passwordInput, { color: theme.text }]} onSubmitEditing={() => void submit()} />
          <Pressable accessibilityRole="button" accessibilityLabel={visiblePassword ? 'Hide password' : 'Show password'} disabled={busy} onPress={() => setVisiblePassword(!visiblePassword)} style={styles.eyeButton}>
            <SymbolView name={{ ios: visiblePassword ? 'eye.slash' : 'eye', android: visiblePassword ? 'visibility_off' : 'visibility', web: visiblePassword ? 'visibility_off' : 'visibility' }} size={21} tintColor={theme.textSecondary} />
          </Pressable>
        </View>
      </View> : null}
      {!signup && !reset ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => onModeChange('reset')} style={styles.forgot}>
        <ThemedText style={[styles.linkText, { color: theme.textSecondary }]}>Forgot password?</ThemedText>
      </Pressable> : null}
      {error ? <ThemedText accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.feedback, { color: theme.danger }]}>{error}</ThemedText> : null}
      {notice ? <ThemedText accessibilityLiveRegion="polite" style={[styles.feedback, { color: theme.text }]}>{notice}</ThemedText> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={reset ? 'Send reset link' : signup ? 'Create account' : 'Log in'} accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void submit()} style={({ pressed }) => [styles.primary, { backgroundColor: theme.tint, opacity: busy || pressed ? 0.7 : 1 }]}>
        {busy ? <ActivityIndicator color="#102B23" /> : <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={20} tintColor="#102B23" />}
        <ThemedText type="smallBold" style={styles.primaryText}>{busy ? 'One moment...' : reset ? 'Send reset link' : signup ? 'Create account' : 'Log in'}</ThemedText>
      </Pressable>
      <View style={[styles.formFooter, { borderColor: theme.border }]}>
        <ThemedText style={[styles.linkText, { color: theme.textSecondary }]}>{reset ? 'Remember your password?' : signup ? 'Already have an account?' : 'New to Americas Travel?'}</ThemedText>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => onModeChange(signup || reset ? 'login' : 'signup')} style={styles.textButton}>
          <ThemedText type="smallBold" style={styles.linkText}>{signup || reset ? 'Log in' : 'Sign up'}</ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ACCOUNT_COLORS.background, overflow: 'hidden' },
  bottomSafeArea: { backgroundColor: ACCOUNT_COLORS.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  shell: { width: '100%', flexGrow: 1 },
  photoTint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 27, 24, 0.46)' },
  photoSection: { flexGrow: 1, paddingTop: 24, paddingBottom: 36, gap: 38, justifyContent: 'space-between', minHeight: 330 },
  photoSectionCompact: { minHeight: 260, gap: 24, paddingTop: 16, paddingBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 12, lineHeight: 18, flex: 1, color: '#FFFFFF' },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  linkText: { fontSize: 14, lineHeight: 20, color: ACCOUNT_COLORS.tint },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 11, lineHeight: 17, letterSpacing: 0, flexShrink: 1, color: ACCOUNT_COLORS.tint },
  chapterLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chapterDash: { width: 24, height: 2, backgroundColor: ACCOUNT_COLORS.tint },
  primary: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryText: { color: ACCOUNT_COLORS.background, fontSize: 16, lineHeight: 22, flexShrink: 1 },
  formBand: { backgroundColor: ACCOUNT_COLORS.background, paddingTop: 24, paddingBottom: 24, borderTopWidth: 1, borderColor: ACCOUNT_COLORS.border },
  form: { gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  formSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 4 },
  formSectionTitle: { fontFamily: Fonts.mono, fontSize: 11, lineHeight: 18, color: ACCOUNT_COLORS.textSecondary },
  sectionRule: { flex: 1, height: 1, backgroundColor: ACCOUNT_COLORS.border },
  formHeading: { gap: 12 },
  formTitle: { fontSize: 52, lineHeight: 58, letterSpacing: 0, fontWeight: '800', color: '#FFFFFF' },
  formTitleWide: { fontSize: 72, lineHeight: 78 },
  formTitleCompact: { fontSize: 40, lineHeight: 46 },
  subtitle: { fontSize: 16, lineHeight: 24, color: '#FFFFFF', maxWidth: 440 },
  field: { gap: 8 },
  label: { fontSize: 14, lineHeight: 20, color: ACCOUNT_COLORS.text },
  input: { minHeight: 56, borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontFamily: Fonts.sans, fontSize: 18, lineHeight: 27 },
  passwordShell: { borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, minWidth: 0, minHeight: 54, paddingLeft: 16, paddingVertical: 14, fontFamily: Fonts.sans, fontSize: 18, lineHeight: 27 },
  eyeButton: { width: 48, height: 54, alignItems: 'center', justifyContent: 'center' },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: -12 },
  feedback: { fontSize: 14, lineHeight: 22 },
  formFooter: { borderTopWidth: 1, paddingTop: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 },
});