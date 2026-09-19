export type AuthDestination = 'loading' | 'signed-out' | 'signed-in';

export function resolveAuthDestination(ready: boolean, hasUser: boolean): AuthDestination {
  if (!ready) {
    return 'loading';
  }

  return hasUser ? 'signed-in' : 'signed-out';
}
