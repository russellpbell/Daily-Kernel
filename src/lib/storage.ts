const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export interface StoredUser {
  id: string;
  name: string;
  cards_per_briefing: number;
}

// Token helpers

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// User helpers

export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setUser(user: StoredUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
}

// Combined helpers

export function saveAuth(token: string, user: StoredUser): void {
  setToken(token);
  setUser(user);
}

export function clearAuth(): void {
  removeToken();
  removeUser();
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
