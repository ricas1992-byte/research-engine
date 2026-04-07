import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { useStore } from '../data/store';
import type { Axis, Status } from '../types/insight';
import { AXIS_COLORS, CROSSREF_LABELS, CROSSREF_COLORS } from '../utils/colors';
import { CrossRefCard } from '../components/CrossRefCard';

const ALL_AXES: Axis[] = ['כללי', 'תיאורטי', 'ביצועי', 'פסיכולוגי', 'מוסדי', 'פדגוגי'];
const ALL_STATUSES: Status[] = ['גולמי', 'מעובד', 'מוכן'];

const STATUS_CHART_COLORS: Record<Status, string> = {
  'גולמי': '#9ca3af',
  'מעובד': '#f59e0b',
  'מוכן':  '#10b981',
};

export function Dashboard() {
  const {
    insights, sources, crossRefs, blindSpots, patterns,
    analysis, loadSeedData, rescanAll, detectBlindSpots, findPatterns,
  } = useStore();

  useEffect(() => {
    loadSeedData();
  }, [loadSeedData]);

  // Chart data: insights per axis, broken down by status
  const chartData = ALL_AXES.map((axis) => {
    const axisInsights = insights.filter((i) => i.axis === axis);
    const entry: Record<string, string | number> = { axis };
    ALL_STATUSES.forEach((status) => {
      entry[status] = axisInsights.filter((i) => i.status === status).length;
    });
    return entry;
  });

  const totalByStatus: Record<Status, number> = { 'גולמי': 0, 'מעובד': 0, 'מוכן': 0 };
  insights.forEach((i) => totalByStatus[i.status]++);

  const openBlindSpots = blindSpots.filter((bs) => !bs.resolvedBy);
  const recentCrossRefs = [...crossRefs].slice(0, 5);

  // Zacharia question of the day: first high-severity blind spot, or last pattern's implication
  const zachariaOfDay =
    openBlindSpots.find((bs) => bs.severity === 'high')?.description ??
    patterns[0]?.implication ??
    'הפעל סריקת ניתוח כדי לגלות שאלות חדשות';

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = useStore.getState().importFromJSON(ev.target?.result as string);
        if (!result) alert('שגיאה: קובץ JSON לא תקין');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-hebrew">לוח בקרה</h1>
          <p className="text-gray-500 text-sm mt-0.5">מנוע המחקר של יותם — פדגוגיית פסנתר</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ייבוא JSON
          </button>
          <button
            onClick={() => rescanAll()}
            disabled={analysis.isAnalyzing}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {analysis.isAnalyzing ? 'סורק...' : 'סרוק הכל מחדש'}
          </button>
        </div>
      </div>

      {/* Zacharia question of the day */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">
          שאלת זכריה של היום — מה האדם מבפנים לא רואה?
        </p>
        <p className="text-lg text-amber-900 font-medium leading-relaxed font-hebrew">
          {zachariaOfDay}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="תובנות סה״כ" value={insights.length} sub={`${sources.length} מקורות`} color="blue" />
        <StatCard label="הצלבות" value={crossRefs.length} sub={`${crossRefs.filter((r) => r.discoveredBy === 'engine').length} ממנוע`} color="green" />
        <StatCard
          label="נקודות עיוורון"
          value={openBlindSpots.length}
          sub={`${openBlindSpots.filter((b) => b.severity === 'high').length} קריטיות`}
          color="red"
          linkTo="/blindspots"
        />
        <StatCard label="דפוסים" value={patterns.length} sub="שזוהו" color="purple" />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {ALL_STATUSES.map((status) => (
          <div key={status} className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-gray-800">{totalByStatus[status]}</div>
            <div className="text-sm text-gray-500 mt-1">{status}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h2 className="font-semibold text-gray-700 mb-4">תובנות לפי ציר וסטטוס</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="axis" tick={{ fontSize: 12, fontFamily: 'David Libre, serif' }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontFamily: 'David Libre, serif', fontSize: 13 }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            {ALL_STATUSES.map((status) => (
              <Bar key={status} dataKey={status} stackId="a" fill={STATUS_CHART_COLORS[status]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent cross-refs */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">הצלבות אחרונות</h2>
            <Link to="/map" className="text-sm text-blue-500 hover:text-blue-700">
              כל המפה →
            </Link>
          </div>
          {recentCrossRefs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">אין הצלבות עדיין</p>
          ) : (
            <div className="space-y-3">
              {recentCrossRefs.map((ref) => (
                <CrossRefCard key={ref.id} ref_={ref} insights={insights} sources={sources} />
              ))}
            </div>
          )}
        </div>

        {/* Blind spots summary */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">נקודות עיוורון פתוחות</h2>
            <Link to="/blindspots" className="text-sm text-blue-500 hover:text-blue-700">
              כל הרשימה →
            </Link>
          </div>
          {openBlindSpots.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-gray-500 text-sm">לא זוהו נקודות עיוורון</p>
              <button
                onClick={() => { detectBlindSpots(); findPatterns(); }}
                className="mt-3 text-xs text-blue-500 hover:text-blue-700"
              >
                הפעל סריקה
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {openBlindSpots.slice(0, 4).map((bs) => (
                <div key={bs.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={bs.severity} />
                    <span className="text-xs text-gray-500">{bs.axis}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{bs.description}</p>
                </div>
              ))}
              {openBlindSpots.length > 4 && (
                <p className="text-xs text-gray-400 text-center">
                  + {openBlindSpots.length - 4} נוספות
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, color, linkTo,
}: {
  label: string; value: number; sub: string; color: string; linkTo?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  const content = (
    <div className={`rounded-xl p-4 border text-center ${colorMap[color]} border-current border-opacity-20`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      <div className="text-xs opacity-70 mt-0.5">{sub}</div>
    </div>
  );
  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
}

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const map = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
  };
  const labels = { high: 'גבוה', medium: 'בינוני', low: 'נמוך' };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full ${map[severity]}`}>{labels[severity]}</span>
  );
}
