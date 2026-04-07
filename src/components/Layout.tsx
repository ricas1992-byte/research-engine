import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../data/store';
import { exportDataAsJSON } from '../utils/export';

const NAV_ITEMS = [
  { to: '/',          label: 'לוח בקרה',     icon: '◎' },
  { to: '/editor',    label: 'עורך תובנות',  icon: '✏' },
  { to: '/sources',   label: 'מקורות',       icon: '📚' },
  { to: '/map',       label: 'מפת הצלבות',   icon: '🕸' },
  { to: '/blindspots', label: 'נקודות עיוורון', icon: '👁' },
  { to: '/report',    label: 'דוח זכריה',    icon: '📋' },
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
    <div className="flex h-screen bg-gray-100 overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-l border-gray-200 flex flex-col shadow-sm flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800 font-hebrew">מנוע המחקר</h1>
          <p className="text-xs text-gray-400 mt-0.5">יותם | פסנתר ופדגוגיה</p>
        </div>

        {/* Analysis status */}
        {analysis.isAnalyzing && (
          <div className="mx-3 mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-blue-700 truncate">{analysis.analysisProgress}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className="text-base">{icon}</span>
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
        <div className="border-t border-gray-100 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-1 text-center text-xs text-gray-500">
            <div className="bg-gray-50 rounded p-1">
              <div className="font-bold text-gray-700">{insights.length}</div>
              <div>תובנות</div>
            </div>
            <div className="bg-gray-50 rounded p-1">
              <div className="font-bold text-gray-700">{crossRefs.length}</div>
              <div>הצלבות</div>
            </div>
            <div className="bg-gray-50 rounded p-1">
              <div className="font-bold text-gray-700">{sources.length}</div>
              <div>מקורות</div>
            </div>
            <div className="bg-gray-50 rounded p-1">
              <div className="font-bold text-gray-700">{patterns.length}</div>
              <div>דפוסים</div>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1.5 rounded-lg transition-colors"
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
