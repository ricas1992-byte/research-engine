import type { Axis, CrossRefType } from '../types/insight';

export const AXIS_COLORS: Record<Axis, { bg: string; text: string; border: string; graph: string }> = {
  'כללי':      { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-300',   graph: '#64748b' },
  'תיאורטי':   { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-300',    graph: '#3b82f6' },
  'ביצועי':    { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-300',   graph: '#22c55e' },
  'פסיכולוגי': { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-300',  graph: '#a855f7' },
  'מוסדי':     { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-300',     graph: '#ef4444' },
  'פדגוגי':    { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300',   graph: '#f59e0b' },
};

export const CROSSREF_COLORS: Record<CrossRefType, string> = {
  'supports':    '#22c55e',
  'contradicts': '#ef4444',
  'extends':     '#f97316',
  'blind_spot':  '#a855f7',
  'pattern':     '#3b82f6',
};

export const CROSSREF_LABELS: Record<CrossRefType, string> = {
  'supports':    'תומך',
  'contradicts': 'סותר',
  'extends':     'מרחיב',
  'blind_spot':  'נקודת עיוורון',
  'pattern':     'דפוס',
};

export const STANCE_LABELS: Record<string, string> = {
  'establishment': 'ממסד',
  'peripheral':    'שולי/ביקורתי',
  'neutral':       'ניטרלי',
};

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'גולמי':  { bg: 'bg-gray-100',   text: 'text-gray-600'   },
  'מעובד':  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'מוכן':   { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};
