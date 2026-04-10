import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ─── Storage keys ──────────────────────────────────────────────────────────
const SESSION_KEY  = 'mt-session';
const CRED_KEY     = 'mt-cred-v2';      // fresh key – avoids stale SHA-256 data
const FAILED_KEY   = 'mt-failed';
const LOCKOUT_KEY  = 'mt-lockout';

const MAX_FAILED  = 5;
const LOCKOUT_MS  = 15 * 60 * 1000; // 15 min

// ─── Default credentials ────────────────────────────────────────────────────
const DEFAULT_EMAIL    = 'ricas1992@gmail.com';
const DEFAULT_PASSWORD = 'ricas1992';

// ─── Credential encoding (synchronous, no crypto.subtle required) ───────────
// Stores email (plain) + a derived token.
// btoa is safe here: all current chars are ASCII.
// For Unicode passwords in the future, use encodeURIComponent first.
function makeToken(email: string, password: string): string {
  const raw = email.toLowerCase().trim() + '\x01' + password;
  try {
    return btoa(raw);
  } catch {
    // Fallback for non-Latin chars: percent-encode then btoa
    return btoa(
      encodeURIComponent(raw).replace(
        /%([0-9A-F]{2})/gi,
        (_, hex: string) => String.fromCharCode(parseInt(hex, 16))
      )
    );
  }
}

interface StoredCreds {
  email: string;  // lowercase, for display / changePassword
  token: string;  // makeToken(email, password)
}

function readCreds(): StoredCreds | null {
  try {
    const raw = localStorage.getItem(CRED_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCreds;
  } catch {
    return null;
  }
}

function writeCreds(email: string, password: string): void {
  try {
    const creds: StoredCreds = {
      email: email.toLowerCase().trim(),
      token: makeToken(email, password),
    };
    localStorage.setItem(CRED_KEY, JSON.stringify(creds));
  } catch { /* localStorage unavailable */ }
}

// Run once at module load (synchronous) so credentials are ready before render
function ensureDefaultCreds(): void {
  try {
    if (!localStorage.getItem(CRED_KEY)) {
      writeCreds(DEFAULT_EMAIL, DEFAULT_PASSWORD);
    }
  } catch { /* localStorage unavailable */ }
}
ensureDefaultCreds();

// ─── Context ────────────────────────────────────────────────────────────────
interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  remainingLockoutSeconds: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore session synchronously (no async init needed)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'active';
    } catch {
      return false;
    }
  });

  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    const tick = () => {
      try {
        const until = Number(localStorage.getItem(LOCKOUT_KEY) ?? 0);
        setRemainingLockoutSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
      } catch {
        setRemainingLockoutSeconds(0);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const login = useCallback(async (
    email: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      // ── Lockout check ──────────────────────────────────────────────────
      const lockoutUntil = Number(localStorage.getItem(LOCKOUT_KEY) ?? 0);
      if (Date.now() < lockoutUntil) {
        const sec = Math.ceil((lockoutUntil - Date.now()) / 1000);
        return { ok: false, error: `חשבון נעול. נסה שוב בעוד ${sec} שניות` };
      }

      // ── Credential comparison ──────────────────────────────────────────
      const stored = readCreds();
      if (!stored) {
        // Should not happen – ensureDefaultCreds ran at module load.
        // Re-init and ask user to retry.
        writeCreds(DEFAULT_EMAIL, DEFAULT_PASSWORD);
        return { ok: false, error: 'שגיאת מערכת: רענן את הדף ונסה שוב' };
      }

      const inputToken = makeToken(email, password);

      if (inputToken !== stored.token) {
        const attempts = Number(localStorage.getItem(FAILED_KEY) ?? 0) + 1;
        localStorage.setItem(FAILED_KEY, String(attempts));
        if (attempts >= MAX_FAILED) {
          localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS));
          localStorage.setItem(FAILED_KEY, '0');
          return { ok: false, error: 'יותר מדי ניסיונות כושלים. חשבון נעול ל-15 דקות' };
        }
        return {
          ok: false,
          error: `אימייל או סיסמה שגויים. נותרו ${MAX_FAILED - attempts} ניסיונות`,
        };
      }

      // ── Success ────────────────────────────────────────────────────────
      localStorage.setItem(FAILED_KEY, '0');
      localStorage.removeItem(LOCKOUT_KEY);
      sessionStorage.setItem(SESSION_KEY, 'active');
      setIsAuthenticated(true);
      return { ok: true };
    } catch {
      return { ok: false, error: 'שגיאה לא צפויה. נסה לרענן את הדף' };
    }
  }, []);

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setIsAuthenticated(false);
  }, []);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const stored = readCreds();
      if (!stored) return { ok: false, error: 'שגיאת מערכת' };

      const currentToken = makeToken(stored.email, currentPassword);
      if (currentToken !== stored.token) return { ok: false, error: 'הסיסמה הנוכחית שגויה' };
      if (newPassword.trim().length < 6) return { ok: false, error: 'הסיסמה החדשה חייבת להיות לפחות 6 תווים' };

      writeCreds(stored.email, newPassword);
      return { ok: true };
    } catch {
      return { ok: false, error: 'שגיאה' };
    }
  }, []);

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
