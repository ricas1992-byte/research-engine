import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { useAuth } from '../auth/AuthContext';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/',               label: 'בית',                 icon: '◎',  end: true  },
  { to: '/categories',     label: 'קטגוריות ושאלות',    icon: '📂', end: false },
  { to: '/investigations', label: 'חקירות',              icon: '🔍', end: false },
  { to: '/insights',       label: 'תובנות',              icon: '💡', end: false },
  { to: '/sources',        label: 'מקורות',              icon: '📎', end: false },
  { to: '/output',         label: 'תוצר סופי',           icon: '📝', end: false },
  { to: '/map',            label: 'מפת מחקר',            icon: '🗺', end: false },
];

export function Layout() {
  const {
    categories, subQuestions, investigations, insights, finalOutputs,
    sourceExcerpts,
    exportToJSON, importFromJSON,
  } = useStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState('');

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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ok = importFromJSON(text);
      if (!ok) setImportError('קובץ לא תקין');
      else { setShowImport(false); setImportError(''); }
    };
    reader.readAsText(file);
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
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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

        {/* Footer stats + actions */}
        <div className="border-t border-slate-700/60 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5 text-center">
            {[
              { label: 'קטגוריות', value: categories.length },
              { label: 'שאלות',    value: subQuestions.length },
              { label: 'חקירות',   value: investigations.length },
              { label: 'תובנות',   value: insights.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/70 rounded-lg py-1.5 px-2">
                <div className="text-sm font-semibold text-slate-100">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          {(finalOutputs.length > 0 || sourceExcerpts.length > 0) && (
            <div className="grid grid-cols-2 gap-1.5 text-center">
              {finalOutputs.length > 0 && (
                <div className="bg-slate-800/70 rounded-lg py-1.5 px-2 col-span-1">
                  <div className="text-sm font-semibold text-slate-100">{finalOutputs.length}</div>
                  <div className="text-xs text-slate-500">תוצרים</div>
                </div>
              )}
              {sourceExcerpts.length > 0 && (
                <div className="bg-slate-800/70 rounded-lg py-1.5 px-2 col-span-1">
                  <div className="text-sm font-semibold text-slate-100">{sourceExcerpts.length}</div>
                  <div className="text-xs text-slate-500">ציטוטים</div>
                </div>
              )}
            </div>
          )}

          {/* Export / Import */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-500 hover:text-slate-300 py-1.5 rounded-lg"
              title="ייצוא גיבוי JSON"
            >
              ייצוא
            </button>
            <button
              type="button"
              onClick={() => setShowImport(!showImport)}
              className="flex-1 text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-500 hover:text-slate-300 py-1.5 rounded-lg"
              title="ייבוא מ-JSON"
            >
              ייבוא
            </button>
          </div>

          {showImport && (
            <div className="space-y-1">
              <label className="block">
                <span className="sr-only">בחר קובץ JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-700 file:text-slate-300 file:text-xs hover:file:bg-slate-600"
                />
              </label>
              {importError && (
                <p className="text-xs text-red-400">{importError}</p>
              )}
            </div>
          )}

          {/* Logout */}
          <button
            type="button"
            onClick={() => { if (confirm('להתנתק?')) { logout(); navigate('/login', { replace: true }); } }}
            className="w-full text-xs bg-slate-800/70 hover:bg-red-900/50 text-slate-500 hover:text-red-400 py-1.5 rounded-lg transition-colors"
          >
            התנתקות
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
