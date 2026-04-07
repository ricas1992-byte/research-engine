import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../data/store';
import { exportDataAsJSON } from '../utils/export';

const NAV_ITEMS = [
  { to: '/',          label: 'לוח בקרה',        icon: '◎' },
  { to: '/editor',    label: 'עורך תובנות',     icon: '✏' },
  { to: '/sources',   label: 'מקורות',          icon: '📚' },
  { to: '/map',       label: 'מפת הצלבות',      icon: '🕸' },
  { to: '/blindspots', label: 'נקודות עיוורון', icon: '👁' },
  { to: '/report',    label: 'דוח זכריה',       icon: '📋' },
];

export function Layout() {
  const { insights, sources, crossRefs, blindSpots, patterns, analysis, exportToJSON } = useStore();

  const handleExport = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-engine-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openBlindSpots = blindSpots.filter((bs) => !bs.resolvedBy).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-700/60">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="מאגר תובנות"
            className="w-full h-auto max-h-24 object-contain"
          />
        </div>

        {/* Analysis status */}
        {analysis.isAnalyzing && (
          <div className="mx-3 mt-3 px-3 py-2 bg-indigo-900/40 border border-indigo-700/40 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-xs text-indigo-300 truncate">{analysis.analysisProgress}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto sidebar-scroll">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <span className="w-5 text-center text-base leading-none flex-shrink-0">{icon}</span>
              <span>{label}</span>
              {to === '/blindspots' && openBlindSpots > 0 && (
                <span className="mr-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {openBlindSpots}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer stats + export */}
        <div className="border-t border-slate-700/60 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5 text-center">
            {[
              { label: 'תובנות', value: insights.length },
              { label: 'הצלבות', value: crossRefs.length },
              { label: 'מקורות', value: sources.length },
              { label: 'דפוסים', value: patterns.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/70 rounded-lg py-1.5 px-2">
                <div className="text-sm font-semibold text-slate-100">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="w-full text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-500 hover:text-slate-300 py-1.5 rounded-lg"
          >
            ייצוא גיבוי JSON
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
