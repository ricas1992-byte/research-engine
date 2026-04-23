import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('error-boundary', error.message, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          dir="rtl"
          role="alert"
          className="min-h-screen flex items-center justify-center bg-slate-50 p-6"
        >
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h1 className="text-xl font-semibold text-slate-900">משהו השתבש</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              אירעה שגיאה לא צפויה. הנתונים שלך שמורים ב-Supabase ולא אבדו.
              נסה לרענן את הדף — אם התקלה חוזרת, בדוק את ה-DevTools לפרטים.
            </p>
            <details className="text-xs text-slate-500 bg-slate-50 rounded p-2">
              <summary className="cursor-pointer">פרטי שגיאה</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words" dir="ltr">
                {this.state.error.message}
              </pre>
            </details>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
              >
                רענן דף
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm"
              >
                נסה שוב
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
