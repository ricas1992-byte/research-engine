import { useState } from 'react';
import { useStore } from '../data/store';
import type { InsightStatus } from '../types/index';

const STATUS_OPTIONS: InsightStatus[] = ['גולמי', 'מעובד', 'מוכן'];

const STATUS_STYLE: Record<InsightStatus, string> = {
  גולמי:  'bg-slate-100 text-slate-600',
  מעובד: 'bg-amber-100 text-amber-700',
  מוכן:  'bg-emerald-100 text-emerald-700',
};

type EditForm = { id: string; text: string; status: InsightStatus; investigationId: string } | null;

export function InsightsView() {
  const {
    categories, subQuestions, investigations, insights,
    addInsight, updateInsight, deleteInsight,
  } = useStore();

  const [filterCatId, setFilterCatId] = useState('');
  const [filterSqId, setFilterSqId] = useState('');
  const [filterInvId, setFilterInvId] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState('');
  const [newStatus, setNewStatus] = useState<InsightStatus>('גולמי');
  const [newInvId, setNewInvId] = useState('');

  const [editing, setEditing] = useState<EditForm>(null);

  // Filter cascade
  const catSqs = filterCatId ? subQuestions.filter((sq) => sq.categoryId === filterCatId) : subQuestions;
  const catSqIds = catSqs.map((sq) => sq.id);
  const sqInvs = filterSqId
    ? investigations.filter((inv) => inv.subQuestionId === filterSqId)
    : filterCatId
    ? investigations.filter((inv) => catSqIds.includes(inv.subQuestionId))
    : investigations;
  const sqInvIds = sqInvs.map((inv) => inv.id);

  const filteredInsights = insights.filter((ins) => {
    if (filterInvId) return ins.investigationId === filterInvId;
    return sqInvIds.includes(ins.investigationId);
  });

  // Group insights by investigation
  const grouped = sqInvs
    .map((inv) => ({
      inv,
      items: filteredInsights.filter((ins) => ins.investigationId === inv.id),
    }))
    .filter((g) => g.items.length > 0 || filterInvId === g.inv.id);

  const handleAdd = () => {
    if (!newText.trim() || !newInvId) return;
    addInsight({ text: newText.trim(), status: newStatus, investigationId: newInvId });
    setNewText(''); setNewStatus('גולמי'); setNewInvId('');
    setShowAdd(false);
  };

  const handleUpdate = () => {
    if (!editing || !editing.text.trim()) return;
    updateInsight(editing.id, { text: editing.text.trim(), status: editing.status, investigationId: editing.investigationId });
    setEditing(null);
  };

  const getCatColor = (sqId: string) => {
    const sq = subQuestions.find((s) => s.id === sqId);
    if (!sq) return '#94a3b8';
    const cat = categories.find((c) => c.id === sq.categoryId);
    return cat?.color ?? '#94a3b8';
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">תובנות</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          disabled={investigations.length === 0}
          title={investigations.length === 0 ? 'הוסף חקירות תחילה' : ''}
        >
          + תובנה חדשה
        </button>
      </div>

      {investigations.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">הוסף חקירות תחילה כדי להוסיף תובנות.</p>
      )}

      {/* Filters */}
      {investigations.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterCatId}
            onChange={(e) => { setFilterCatId(e.target.value); setFilterSqId(''); setFilterInvId(''); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterSqId}
            onChange={(e) => { setFilterSqId(e.target.value); setFilterInvId(''); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">כל השאלות</option>
            {catSqs.map((sq) => <option key={sq.id} value={sq.id}>{sq.text.length > 60 ? sq.text.slice(0, 60) + '…' : sq.text}</option>)}
          </select>
          <select
            value={filterInvId}
            onChange={(e) => setFilterInvId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">כל החקירות</option>
            {sqInvs.map((inv) => <option key={inv.id} value={inv.id}>{inv.title.length > 60 ? inv.title.slice(0, 60) + '…' : inv.title}</option>)}
          </select>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-slate-800">תובנה חדשה</h3>
          <select
            value={newInvId}
            onChange={(e) => setNewInvId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">בחר חקירה</option>
            {investigations.map((inv) => {
              const sq = subQuestions.find((s) => s.id === inv.subQuestionId);
              const cat = sq ? categories.find((c) => c.id === sq.categoryId) : null;
              return (
                <option key={inv.id} value={inv.id}>
                  {cat ? `[${cat.name}] ` : ''}{inv.title}
                </option>
              );
            })}
          </select>
          <textarea
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="טקסט התובנה"
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500">סטטוס:</span>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setNewStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${newStatus === s ? STATUS_STYLE[s] + ' border-current' : 'border-slate-200 text-slate-500'}`}
              >{s}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">שמור</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100">ביטול</button>
          </div>
        </div>
      )}

      {/* No results */}
      {filteredInsights.length === 0 && !showAdd && investigations.length > 0 && (
        <p className="text-slate-400 text-sm text-center py-8">אין תובנות{filterInvId || filterSqId || filterCatId ? ' לפי הפילטר הנוכחי' : ''}.</p>
      )}

      {/* Grouped by investigation */}
      <div className="space-y-6">
        {grouped.map(({ inv, items }) => {
          const sq = subQuestions.find((s) => s.id === inv.subQuestionId);
          const catColor = getCatColor(inv.subQuestionId);

          return (
            <div key={inv.id} className="space-y-2">
              {/* Investigation header */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
                <h3 className="text-sm font-semibold text-slate-700">{inv.title}</h3>
                {sq && <span className="text-xs text-slate-400 truncate">/ {sq.text.length > 60 ? sq.text.slice(0, 60) + '…' : sq.text}</span>}
              </div>

              {/* Insights */}
              {items.map((ins) => {
                const isEditing = editing?.id === ins.id;
                return (
                  <div key={ins.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <select
                          value={editing.investigationId}
                          onChange={(e) => setEditing({ ...editing, investigationId: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {investigations.map((i) => {
                            const s = subQuestions.find((sq) => sq.id === i.subQuestionId);
                            const c = s ? categories.find((cc) => cc.id === s.categoryId) : null;
                            return (
                              <option key={i.id} value={i.id}>
                                {c ? `[${c.name}] ` : ''}{i.title}
                              </option>
                            );
                          })}
                        </select>
                        <textarea
                          autoFocus
                          placeholder="טקסט התובנה"
                          value={editing.text}
                          onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                          rows={3}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                        />
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-slate-500">סטטוס:</span>
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setEditing({ ...editing, status: s })}
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${editing.status === s ? STATUS_STYLE[s] + ' border-current' : 'border-slate-200 text-slate-500'}`}
                            >{s}</button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleUpdate} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">שמור</button>
                          <button type="button" onClick={() => setEditing(null)} className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100">ביטול</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <p className="flex-1 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ins.text}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[ins.status]}`}>{ins.status}</span>
                          <button
                            type="button"
                            onClick={() => setEditing({ id: ins.id, text: ins.text, status: ins.status, investigationId: ins.investigationId })}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          >✏</button>
                          <button
                            type="button"
                            onClick={() => { if (confirm('למחוק תובנה זו?')) deleteInsight(ins.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >🗑</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          );
        })}
      </div>
    </div>
  );
}
