import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthProvider'

export function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || loading) return
    setLoading(true)
    setError('')
    const result = await signIn(email.trim())
    setLoading(false)
    if (result.ok) {
      setSent(true)
    } else {
      setError(result.error ?? 'שגיאה לא ידועה')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl">🎵</span>
          </div>
          <h1 className="text-2xl font-bold text-white">מאגר תובנות</h1>
          <p className="text-slate-400 text-sm mt-1">Musical Thinking</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">התחברות</h2>

          {sent ? (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-4 text-sm leading-relaxed">
              <p className="font-semibold mb-1">✓ קישור ההתחברות נשלח</p>
              <p>בדוק את תיבת המייל של <span className="font-medium">{email}</span> ולחץ על הקישור להמשיך.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  כתובת אימייל
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  dir="ltr"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'שולח...' : 'שלח קישור התחברות'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          גרסה 2.0 · Musical Thinking Research Engine
        </p>
      </div>
    </div>
  )
}
