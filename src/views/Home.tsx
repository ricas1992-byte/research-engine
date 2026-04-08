import { Link } from 'react-router-dom';
import { useStore } from '../data/store';
import { RESEARCH_QUESTION } from '../types/index';

export function Home() {
  const { categories, subQuestions, investigations, insights, finalOutputs } = useStore();

  const stats = [
    { label: 'קטגוריות', value: categories.length, to: '/categories', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { label: 'שאלות משנה', value: subQuestions.length, to: '/categories', color: 'bg-pink-50 border-pink-200 text-pink-700' },
    { label: 'חקירות', value: investigations.length, to: '/investigations', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { label: 'תובנות', value: insights.length, to: '/insights', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'תוצרים סופיים', value: finalOutputs.length, to: '/output', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  ];

  const recentInsights = insights.slice(0, 5);
  const recentInvestigations = investigations.slice(0, 5);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8" dir="rtl">
      {/* Research Question Banner */}
      <div className="bg-gradient-to-l from-slate-800 to-slate-900 rounded-2xl p-8 shadow-lg">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">שאלת המחקר המרכזית</p>
        <blockquote className="text-xl leading-relaxed text-white font-medium mb-6">
          "{RESEARCH_QUESTION.text}"
        </blockquote>
        <p className="text-slate-400 text-sm">— {RESEARCH_QUESTION.attribution}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map(({ label, value, to, color }) => (
          <Link
            key={label}
            to={to}
            className={`border rounded-xl p-4 text-center hover:shadow-md transition-shadow ${color}`}
          >
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-xs font-medium opacity-80">{label}</div>
          </Link>
        ))}
      </div>

      {/* Research flow guide */}
      {categories.length === 0 && (
        <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 space-y-3">
          <p className="text-lg font-medium text-slate-700">ברוך הבא למנוע המחקר</p>
          <p className="text-sm">התחל בהגדרת קטגוריות ושאלות משנה, ואז צלול לחקירות ותובנות.</p>
          <Link
            to="/categories"
            className="inline-block mt-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            הוסף קטגוריה ראשונה →
          </Link>
        </div>
      )}

      {/* Hierarchy reminder */}
      {categories.length > 0 && (
        <div className="grid grid-cols-5 gap-2 text-center text-xs text-slate-500">
          {[
            { label: 'שאלת מחקר', desc: 'קבועה', icon: '⭐' },
            { label: 'קטגוריות', desc: `${categories.length} קיימות`, icon: '📂' },
            { label: 'שאלות משנה', desc: `${subQuestions.length} קיימות`, icon: '❓' },
            { label: 'חקירות', desc: `${investigations.length} קיימות`, icon: '🔍' },
            { label: 'תובנות', desc: `${insights.length} קיימות`, icon: '💡' },
          ].map(({ label, desc, icon }, i, arr) => (
            <div key={label} className="flex items-center gap-1">
              <div className="flex-1 bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                <div className="text-lg mb-1">{icon}</div>
                <div className="font-medium text-slate-700">{label}</div>
                <div className="text-slate-400">{desc}</div>
              </div>
              {i < arr.length - 1 && (
                <span className="text-slate-300 text-lg flex-shrink-0">←</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent items */}
      {(recentInvestigations.length > 0 || recentInsights.length > 0) && (
        <div className="grid grid-cols-2 gap-6">
          {recentInvestigations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">חקירות אחרונות</h3>
              <ul className="space-y-2">
                {recentInvestigations.map((inv) => (
                  <li key={inv.id} className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 truncate shadow-sm">
                    {inv.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recentInsights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">תובנות אחרונות</h3>
              <ul className="space-y-2">
                {recentInsights.map((ins) => {
                  const inv = investigations.find((i) => i.id === ins.investigationId);
                  return (
                    <li key={ins.id} className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm">
                      <p className="text-sm text-slate-700 line-clamp-2">{ins.text}</p>
                      {inv && <p className="text-xs text-slate-400 mt-1 truncate">{inv.title}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
