import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../data/store';

const NAV_ITEMS = [
  { to: '/',               label: 'בית',                 icon: '◎' },
  { to: '/categories',     label: 'קטגוריות ושאלות',    icon: '📂' },
  { to: '/investigations', label: 'חקירות',              icon: '🔍' },
  { to: '/insights',       label: 'תובנות',              icon: '💡' },
  { to: '/output',         label: 'תוצר סופי',           icon: '📝' },
  { to: '/map',            label: 'מפת מחקר',            icon: '🗺' },
];

export function Layout() {
  const { categories, subQuestions, investigations, insights, finalOutputs, exportToJSON } = useStore();

  const handleExport = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `musical-thinking-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-700/60">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="מנוע מחקר"
            className="w-full h-auto max-h-24 object-contain"
          />
        </div>

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
            </NavLink>
          ))}
        </nav>

        {/* Footer stats + export */}
        <div className="border-t border-slate-700/60 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5 text-center">
            {[
              { label: 'קטגוריות', value: categories.length },
              { label: 'שאלות', value: subQuestions.length },
              { label: 'חקירות', value: investigations.length },
              { label: 'תובנות', value: insights.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/70 rounded-lg py-1.5 px-2">
                <div className="text-sm font-semibold text-slate-100">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          {finalOutputs.length > 0 && (
            <div className="bg-slate-800/70 rounded-lg py-1.5 px-2 text-center">
              <span className="text-xs text-slate-500">תוצרים סופיים: </span>
              <span className="text-sm font-semibold text-slate-100">{finalOutputs.length}</span>
            </div>
          )}
          <button
            type="button"
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
