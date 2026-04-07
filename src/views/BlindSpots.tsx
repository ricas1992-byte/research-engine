import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../data/store';
import type { Axis } from '../types/insight';
import type { BlindSpot } from '../types/analysis';
import { AxisBadge } from '../components/AxisBadge';

const ALL_AXES: Axis[] = ['כללי', 'תיאורטי', 'ביצועי', 'פסיכולוגי', 'מוסדי', 'פדגוגי'];

const TYPE_LABELS: Record<BlindSpot['type'], string> = {
  'missing_coverage':          'כיסוי חסר',
  'unresolved_contradiction':  'סתירה לא פתורה',
  'open_question':             'שאלה פתוחה',
  'unchallenged_establishment': 'ממסד לא מאותגר',
};

const TYPE_COLORS: Record<BlindSpot['type'], string> = {
  'missing_coverage':          'bg-blue-100 text-blue-700',
  'unresolved_contradiction':  'bg-red-100 text-red-700',
  'open_question':             'bg-purple-100 text-purple-700',
  'unchallenged_establishment': 'bg-orange-100 text-orange-700',
};

const SEVERITY_COLORS = {
  high:   'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low:    'bg-slate-50 text-slate-600 border-slate-200',
};

const SEVERITY_LABELS = { high: 'גבוה', medium: 'בינוני', low: 'נמוך' };

export function BlindSpots() {
  const { blindSpots, insights, detectBlindSpots, findPatterns, updateBlindSpot, analysis } = useStore();
  const [filterAxis, setFilterAxis] = useState<Axis | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<'high' | 'medium' | 'low' | ''>('');
  const [filterType, setFilterType] = useState<BlindSpot['type'] | ''>('');
  const [showResolved, setShowResolved] = useState(false);

  const filtered = blindSpots.filter((bs) => {
    if (!showResolved && bs.resolvedBy) return false;
    if (filterAxis && bs.axis !== filterAxis) return false;
    if (filterSeverity && bs.severity !== filterSeverity) return false;
    if (filterType && bs.type !== filterType) return false;
    return true;
  });

  const openCount = blindSpots.filter((bs) => !bs.resolvedBy).length;
  const highCount = blindSpots.filter((bs) => !bs.resolvedBy && bs.severity === 'high').length;

  const handleRescan = () => {
    detectBlindSpots();
    findPatterns();
  };

  const handleMarkResolved = (blindSpot: BlindSpot) => {
    const insightId = window.prompt('מזהה תובנה שפותרת זאת (השאר ריק לסימון ידני):');
    updateBlindSpot(blindSpot.id, {
      resolvedBy: insightId || 'manual-resolved',
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">נקודות עיוורון</h1>
          <p className="text-slate-400 text-sm">
            {openCount} פתוחות
            {highCount > 0 && <span className="text-red-500 font-medium"> ({highCount} קריטיות)</span>}
            {' · '}
            {blindSpots.filter((bs) => bs.resolvedBy).length} טופלו
          </p>
        </div>
        <button
          onClick={handleRescan}
          disabled={analysis.isAnalyzing}
          className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {analysis.isAnalyzing ? 'סורק...' : 'סרוק מחדש'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {(['high', 'medium', 'low'] as const).map((sev) => {
          const count = blindSpots.filter((bs) => !bs.resolvedBy && bs.severity === sev).length;
          return (
            <div key={sev} className={`rounded-xl p-4 text-center border shadow-card ${SEVERITY_COLORS[sev]}`}>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm mt-0.5">{SEVERITY_LABELS[sev]}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200/80 rounded-xl p-3 shadow-card">
        <span className="text-sm text-slate-500">סינון:</span>

        <select
          value={filterAxis}
          onChange={(e) => setFilterAxis(e.target.value as Axis | '')}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"
        >
          <option value="">כל הצירים</option>
          {ALL_AXES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"
        >
          <option value="">כל החומרות</option>
          <option value="high">גבוה</option>
          <option value="medium">בינוני</option>
          <option value="low">נמוך</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as BlindSpot['type'] | '')}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"
        >
          <option value="">כל הסוגים</option>
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer mr-auto">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded accent-indigo-600"
          />
          הצג טופלו
        </label>
      </div>

      {/* Blind spots list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {blindSpots.length === 0 ? (
            <>
              <p className="text-5xl mb-3">👁</p>
              <p className="text-lg">לא זוהו נקודות עיוורון</p>
              <button
                onClick={handleRescan}
                className="mt-3 text-sm text-indigo-500 hover:text-indigo-700"
              >
                הפעל סריקה ראשונה
              </button>
            </>
          ) : (
            <p>אין תוצאות לפילטר הנוכחי</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((bs) => (
            <div
              key={bs.id}
              className={`bg-white border rounded-xl p-5 space-y-3 shadow-card transition-opacity ${
                bs.resolvedBy ? 'opacity-50' : ''
              } ${bs.severity === 'high' ? 'border-red-200' : 'border-slate-200/80'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[bs.severity]}`}>
                    {SEVERITY_LABELS[bs.severity]}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[bs.type]}`}>
                    {TYPE_LABELS[bs.type]}
                  </span>
                  <AxisBadge axis={bs.axis} size="sm" />
                  {bs.resolvedBy && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      ✓ טופל
                    </span>
                  )}
                </div>

                {!bs.resolvedBy && (
                  <button
                    onClick={() => handleMarkResolved(bs)}
                    className="text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 px-2 py-1 rounded-lg flex-shrink-0 transition-colors"
                  >
                    סמן כטופל
                  </button>
                )}
              </div>

              <p className="text-slate-700 leading-relaxed">{bs.description}</p>

              {bs.resolvedBy && bs.resolvedBy !== 'manual-resolved' && (
                <div className="text-xs text-slate-500">
                  נפתר על ידי תובנה:{' '}
                  <Link
                    to={`/editor/${bs.resolvedBy}`}
                    className="text-indigo-500 hover:text-indigo-700"
                  >
                    {insights.find((i) => i.id === bs.resolvedBy)?.content.slice(0, 50) ?? bs.resolvedBy}
                  </Link>
                </div>
              )}

              <p className="text-xs text-slate-400">
                {new Date(bs.createdAt).toLocaleDateString('he-IL')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
