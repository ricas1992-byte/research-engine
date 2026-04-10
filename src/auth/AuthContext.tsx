import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const SESSION_KEY = 'mt-session';
const CREDENTIALS_KEY = 'mt-credentials';
const FAILED_ATTEMPTS_KEY = 'mt-failed-attempts';
const LOCKOUT_UNTIL_KEY = 'mt-lockout-until';

const MAX_FAILED = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Default credentials (hashed on first boot)
const DEFAULT_EMAIL = 'ricas1992@gmail.com';
const DEFAULT_PASSWORD = 'ricas1992';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text + '::mt-salt-v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface Credentials {
  emailHash: string;
  passwordHash: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  remainingLockoutSeconds: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function initDefaultCredentials(): Promise<void> {
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  if (stored) return; // already configured
  const emailHash = await sha256(DEFAULT_EMAIL.toLowerCase().trim());
  const passwordHash = await sha256(DEFAULT_PASSWORD);
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ emailHash, passwordHash }));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0);

  // Init: set up default credentials and restore session
  useEffect(() => {
    let cancelled = false;
    initDefaultCredentials().then(() => {
      if (cancelled) return;
      const session = sessionStorage.getItem(SESSION_KEY);
      if (session === 'active') setIsAuthenticated(true);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    const tick = () => {
      const until = Number(localStorage.getItem(LOCKOUT_UNTIL_KEY) ?? 0);
      const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setRemainingLockoutSeconds(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    // Check lockout
    const lockoutUntil = Number(localStorage.getItem(LOCKOUT_UNTIL_KEY) ?? 0);
    if (Date.now() < lockoutUntil) {
      const sec = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return { ok: false, error: `חשבון נעול. נסה שוב בעוד ${sec} שניות` };
    }

    const stored = localStorage.getItem(CREDENTIALS_KEY);
    if (!stored) return { ok: false, error: 'שגיאת מערכת: לא נמצאו פרטי גישה' };

    const { emailHash, passwordHash } = JSON.parse(stored) as Credentials;

    const [inputEmailHash, inputPasswordHash] = await Promise.all([
      sha256(email.toLowerCase().trim()),
      sha256(password),
    ]);

    if (inputEmailHash !== emailHash || inputPasswordHash !== passwordHash) {
      const attempts = Number(localStorage.getItem(FAILED_ATTEMPTS_KEY) ?? 0) + 1;
      localStorage.setItem(FAILED_ATTEMPTS_KEY, String(attempts));
      if (attempts >= MAX_FAILED) {
        localStorage.setItem(LOCKOUT_UNTIL_KEY, String(Date.now() + LOCKOUT_MS));
        localStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
        return { ok: false, error: `יותר מדי ניסיונות כושלים. חשבון נעול ל-15 דקות` };
      }
      const remaining = MAX_FAILED - attempts;
      return {
        ok: false,
        error: `אימייל או סיסמה שגויים. נותרו ${remaining} ניסיונות`,
      };
    }

    // Success
    localStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
    localStorage.removeItem(LOCKOUT_UNTIL_KEY);
    sessionStorage.setItem(SESSION_KEY, 'active');
    setIsAuthenticated(true);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    if (!stored) return { ok: false, error: 'שגיאת מערכת' };

    const { emailHash, passwordHash } = JSON.parse(stored) as Credentials;
    const currentHash = await sha256(currentPassword);

    if (currentHash !== passwordHash) return { ok: false, error: 'הסיסמה הנוכחית שגויה' };
    if (newPassword.length < 6) return { ok: false, error: 'הסיסמה החדשה חייבת להיות לפחות 6 תווים' };

    const newHash = await sha256(newPassword);
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ emailHash, passwordHash: newHash }));
    return { ok: true };
  }, []);

  if (!ready) return null; // wait for async init

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, changePassword, remainingLockoutSeconds }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
