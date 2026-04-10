import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

export function LoginView() {
  const { login, remainingLockoutSeconds } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || remainingLockoutSeconds > 0) return;
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'שגיאה לא ידועה');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl">🎵</span>
          </div>
          <h1 className="text-2xl font-bold text-white">מנוע המחקר</h1>
          <p className="text-slate-400 text-sm mt-1">Musical Thinking</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!showForgot ? (
            <>
              <h2 className="text-lg font-semibold text-slate-800 mb-6">התחברות</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    אימייל
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    dir="ltr"
                    autoComplete="email"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading || remainingLockoutSeconds > 0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    סיסמה
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    autoComplete="current-password"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading || remainingLockoutSeconds > 0}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                {remainingLockoutSeconds > 0 && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg px-4 py-3">
                    חשבון נעול זמנית. נסה שוב בעוד{' '}
                    <span className="font-bold tabular-nums">{remainingLockoutSeconds}</span>{' '}
                    שניות
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || remainingLockoutSeconds > 0 || !email || !password}
                  className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'מתחבר...' : 'כניסה'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-sm text-slate-500 hover:text-indigo-600 underline"
                >
                  שכחתי סיסמה
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
              >
                ← חזרה
              </button>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">איפוס סיסמה</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-amber-800 font-medium">
                  מערכת זו אינה שולחת אימיילים אוטומטיים.
                </p>
                <p className="text-sm text-amber-700">
                  לאיפוס הסיסמה, פנה למנהל המערכת ובקש לאפס את פרטי הגישה שלך.
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  אפשרות חלופית: אם יש לך גיבוי JSON של הנתונים, ניתן לנקות את נתוני הדפדפן
                  (localStorage) ולהגדיר מחדש את הגישה – אם כי זה יאפס גם את הסיסמה.
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          גרסה 1.0 · Musical Thinking Research Engine
        </p>
      </div>
    </div>
  );
}
