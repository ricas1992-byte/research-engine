/**
 * Centralized design tokens. Use these instead of hardcoding colors
 * or status labels across components.
 */

export const CATEGORY_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#84cc16',
] as const

export const STATUS_LABELS = {
  investigation: {
    'גולמי': { bg: 'bg-slate-100',  text: 'text-slate-700'  },
    'בעבודה': { bg: 'bg-amber-100',  text: 'text-amber-800'  },
    'הושלמה': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  },
  insight: {
    'גולמי': { bg: 'bg-slate-100',  text: 'text-slate-700'  },
    'מעובד': { bg: 'bg-amber-100',  text: 'text-amber-800'  },
    'מוכן':  { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  },
} as const
