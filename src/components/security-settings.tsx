import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { GlassSurface } from '@/components/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { changePassword, passwordErrorMessage } from '@/lib/change-password';
import { useAuthSession } from '@/providers/auth-session';

export function SecuritySettings() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <GlassSurface style={[styles.card, { borderColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Security"
        accessibilityState={{ expanded, disabled: busy }} disabled={busy}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.6 : 1 }]}>
        <View style={styles.intro}>
          <View style={styles.row}>
            <SymbolView name={{ ios: 'lock.shield', android: 'shield', web: 'shield' }} size={20} tintColor={theme.tint} />
            <ThemedText type="sectionTitle">Security</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">Manage your password</ThemedText>
        </View>
        <SymbolView name={{ ios: expanded ? 'chevron.up' : 'chevron.down', android: expanded ? 'expand_less' : 'expand_more', web: expanded ? 'expand_less' : 'expand_more' }} size={18} tintColor={theme.textSecondary} />
      </Pressable>
      {expanded ? <PasswordForm onBusyChange={setBusy} /> : null}
    </GlassSurface>
  );
}

function PasswordForm({ onBusyChange }: { onBusyChange: (busy: boolean) => void }) {
  const theme = useTheme();
  const { user } = useAuthSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current || !user) return;
    submitting.current = true;
    setBusy(true);
    onBusyChange(true);
    setError('');
    setNotice('');
    try {
      await changePassword(user, current, next, confirmation);
      setCurrent('');
      setNext('');
      setConfirmation('');
      setNotice('Password updated. Use your new password the next time you log in.');
    } catch (failure) {
      setError(passwordErrorMessage(failure));
    } finally {
      submitting.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  return (
    <View style={[styles.details, { borderTopColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">Confirm your current password, then choose a new one with at least 8 characters.</ThemedText>
      {[
        { label: 'Current password', value: current, onChange: setCurrent, current: true },
        { label: 'New password', value: next, onChange: setNext, current: false },
        { label: 'Confirm new password', value: confirmation, onChange: setConfirmation, current: false },
      ].map((field) => (
        <View key={field.label} style={styles.field}>
          <ThemedText type="smallBold">{field.label}</ThemedText>
          <TextInput accessibilityLabel={field.label} value={field.value} onChangeText={field.onChange}
            secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!busy}
            autoComplete={field.current ? 'current-password' : 'new-password'}
            textContentType={field.current ? 'password' : 'newPassword'}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceMuted }]} />
        </View>
      ))}
      {error ? <ThemedText type="small" accessibilityRole="alert" style={{ color: theme.danger }}>{error}</ThemedText> : null}
      {notice ? <ThemedText type="small" accessibilityLiveRegion="polite">{notice}</ThemedText> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Update password"
        accessibilityState={{ busy, disabled: busy }} disabled={busy} onPress={() => void submit()}
        style={({ pressed }) => [styles.button, { borderColor: theme.tint, opacity: busy || pressed ? 0.6 : 1 }]}>
        {busy ? <ActivityIndicator color={theme.tint} /> : null}
        <ThemedText type="smallBold">{busy ? 'Updating...' : 'Update password'}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  tab: { minHeight: 64, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  intro: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  details: { borderTopWidth: 1, padding: 18, gap: 18 },
  field: { gap: 8 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  button: { alignSelf: 'flex-end', minHeight: 48, paddingHorizontal: 16, borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
});
