import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, type User } from 'firebase/auth';

export async function changePassword(user: User, current: string, next: string, confirmation: string) {
  if (!user.email) throw new Error('Log in with your email to change your password.');
  if (!current) throw new Error('Enter your current password.');
  if (next.length < 8) throw new Error('Use at least 8 characters for your new password.');
  if (next !== confirmation) throw new Error('The new passwords do not match.');
  if (current === next) throw new Error('Choose a different password from your current one.');

  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
  await updatePassword(user, next);
}

export function passwordErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password': return 'Your current password is incorrect.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements': return 'Choose a stronger password with uppercase, lowercase, numbers, and a symbol.';
    case 'auth/network-request-failed': return 'Check your internet connection and try again.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait before trying again.';
    case 'auth/requires-recent-login':
    case 'auth/user-token-expired': return 'Please sign out and log in again, then retry.';
    default: return !code && error instanceof Error ? error.message : 'Unable to change your password. Please try again.';
  }
}
