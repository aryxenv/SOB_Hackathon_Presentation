const USER_SESSION_KEY = 'sob_user_session';

export type AuthProvider = 'google' | 'facebook' | 'apple' | 'email';

export interface UserSession {
  name: string;
  email: string;
  provider: AuthProvider;
}

let sessionCacheJson: string | null = null;
let sessionCache: UserSession | null = null;

function readSessionRaw(): string {
  // Login is session-only — do not persist in localStorage
  const legacy = localStorage.getItem(USER_SESSION_KEY);
  if (legacy) {
    localStorage.removeItem(USER_SESSION_KEY);
  }
  return sessionStorage.getItem(USER_SESSION_KEY) ?? '';
}

function writeSessionRaw(value: string | null): void {
  if (value === null) {
    sessionStorage.removeItem(USER_SESSION_KEY);
  } else {
    sessionStorage.setItem(USER_SESSION_KEY, value);
  }
}

function invalidateCache(): void {
  sessionCacheJson = null;
}

export function getSessionSnapshot(): UserSession | null {
  const raw = readSessionRaw();
  if (raw === sessionCacheJson) {
    return sessionCache;
  }

  sessionCacheJson = raw;

  if (!raw) {
    sessionCache = null;
    return sessionCache;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserSession>;
    sessionCache = {
      name: parsed.name ?? '',
      email: parsed.email ?? '',
      provider: parsed.provider ?? 'email',
    };
  } catch {
    sessionCache = null;
  }

  return sessionCache;
}

/** Only explicit sign-in — never donor/donation details. */
export function getIdentitySnapshot(): UserSession | null {
  return getSessionSnapshot();
}

export function getIsLoggedInSnapshot(): boolean {
  return getSessionSnapshot() !== null;
}

export function getUserSession(): UserSession | null {
  return getSessionSnapshot();
}

export function setUserSession(session: UserSession): void {
  writeSessionRaw(JSON.stringify(session));
  notifySessionUpdated();
}

export function clearUserSession(): void {
  writeSessionRaw(null);
  notifySessionUpdated();
}

export function subscribeSession(onStoreChange: () => void): () => void {
  const invalidate = () => {
    invalidateCache();
    onStoreChange();
  };

  window.addEventListener('storage', invalidate);
  window.addEventListener('sob-session-updated', invalidate);

  return () => {
    window.removeEventListener('storage', invalidate);
    window.removeEventListener('sob-session-updated', invalidate);
  };
}

export function notifySessionUpdated(): void {
  invalidateCache();
  window.dispatchEvent(new Event('sob-session-updated'));
}

export function sessionInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
