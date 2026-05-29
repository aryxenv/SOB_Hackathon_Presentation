import { useSyncExternalStore } from 'react';
import {
  getIdentitySnapshot,
  getIsLoggedInSnapshot,
  subscribeSession,
  type UserSession,
} from '../lib/session';

export function useProfileIdentity(): UserSession | null {
  return useSyncExternalStore(subscribeSession, getIdentitySnapshot, () => null);
}

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribeSession, getIsLoggedInSnapshot, () => false);
}
