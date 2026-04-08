import { useState } from 'react';
import { useStore } from '../data/store';
import type { InvestigationStatus } from '../types/index';

const STATUS_OPTIONS: InvestigationStatus[] = ['גולמי', 'בעבודה', 'הושלמה'];

const STATUS_STYLE: Record<InvestigationStatus, string> = {
  גולמי:    'bg-slate-100 text-slate-600',
  בעבודה:  'bg-amber-100 text-amber-700',
  הושלמה: 'bg-emerald-100 text-emerald-700',
};

type EditForm = {
  id: string;
  title: string;
  content: string;
  status: InvestigationStatus;
  subQuestionId: string;
} | null;

export function Investigations() {
  const {
    categories, subQuestions, investigations, insights,
    addInvestigation, updateInvestigation, deleteInvestigation,
  } = useStore();

  const [filterCatId, setFilterCatId] = useState('');
  const [filterSqId, setFilterSqId] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newStatus, setNewStatus] = useState<InvestigationStatus>('גולמי');
  const [newSqId, setNewSqId] = useState('');

  const [editing, setEditing] = useState<EditForm>(null);

  const filteredCatSqs = filterCatId
    ? subQuestions.filter((sq) => sq.categoryId === filterCatId)
    : subQuestions;

  const filteredInvs = investigations.filter((inv) => {
    if (filterSqId) return inv.subQuestionId === filterSqId;
    if (filterCatId) {
      const catSqIds = subQuestions.filter((sq) => sq.categoryId === filterCatId).map((sq) => sq.id);
      return catSqIds.includes(inv.subQuestionId);
    }
    return true;
  });

  const handleAdd = () => {
    if (!newTitle.trim() || !newSqId) return;
    addInvestigation({ title: newTitle.trim(), content: newContent.trim(), status: newStatus, subQuestionId: newSqId });
    setNewTitle(''); setNewContent(''); setNewStatus('גולמי'); setNewSqId('');
    setShowAdd(false);
  };

  const handleUpdate = () => {
    if (!editing || !editing.title.trim() || !editing.subQuestionId) return;
    updateInvestigation(editing.id, { title: editing.title.trim(), content: editing.content.trim(), status: editing.status, subQuestionId: editing.subQuestionId });
    setEditing(null);
  };

  const getSqLabel = (sqId: string) => {
    const sq = subQuestions.find((s) => s.id === sqId);
    if (!sq) return '—';
    const cat = categories.find((c) => c.id === sq.categoryId);
    return cat ? `${cat.name} / ${sq.text}` : sq.text;
  };

  const insightCount = (invId: string) => insights.filter((ins) => ins.investigationId === invId).length;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">חקירות</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          disabled={subQuestions.length === 0}
          title={subQuestions.length === 0 ? 'הוסף קטגוריות ושאלות משנה תחילה' : ''}
        >
          + חקירה חדשה
        </button>
      </div>

      {subQuestions.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">הגדר קטגוריות ושאלות משנה תחילה כדי להוסיף חקירות.</p>
      )}

      {/* Filters */}
      {subQuestions.length > 0 && (
        <div className="flex gap-3">
          <select
            value={filterCatId}
            onChange={(e) => { setFilterCatId(e.target.value); setFilterSqId(''); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterSqId}
            onChange={(e) => setFilterSqId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">כל השאלות</option>
            {filteredCatSqs.map((sq) => (
              <option key={sq.id} value={sq.id}>{sq.text.length > 60 ? sq.text.slice(0, 60) + '…' : sq.text}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-slate-800">חקירה חדשה</h3>
          <select
            value={newSqId}
            onChange={(e) => setNewSqId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">בחר שאלת משנה</option>
            {subQuestions.map((sq) => {
              const cat = categories.find((c) => c.id === sq.categoryId);
              return (
                <option key={sq.id} value={sq.id}>
                  {cat ? `[${cat.name}] ` : ''}{sq.text.length > 70 ? sq.text.slice(0, 70) + '…' : sq.text}
                </option>
              );
            })}
          </select>
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="כותרת החקירה"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="תוכן החקירה (טקסט חופשי)"
            rows={4}
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

      {/* List */}
      {filteredInvs.length === 0 && !showAdd && subQuestions.length > 0 && (
        <p className="text-slate-400 text-sm text-center py-8">אין חקירות{filterSqId || filterCatId ? ' לפי הפילטר הנוכחי' : ''}.</p>
      )}

      <div className="space-y-4">
        {filteredInvs.map((inv) => {
          const isEditing = editing?.id === inv.id;
          const sq = subQuestions.find((s) => s.id === inv.subQuestionId);
          const cat = sq ? categories.find((c) => c.id === sq.categoryId) : null;

          return (
            <div key={inv.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {isEditing ? (
                <div className="p-5 space-y-3">
                  <select
                    value={editing.subQuestionId}
                    onChange={(e) => setEditing({ ...editing, subQuestionId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {subQuestions.map((s) => {
                      const c = categories.find((cc) => cc.id === s.categoryId);
                      return (
                        <option key={s.id} value={s.id}>
                          {c ? `[${c.name}] ` : ''}{s.text.length > 70 ? s.text.slice(0, 70) + '…' : s.text}
                        </option>
                      );
                    })}
                  </select>
                  <input
                    autoFocus
                    placeholder="כותרת החקירה"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    placeholder="תוכן החקירה"
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    rows={4}
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
                <>
                  <div className="flex items-start gap-3 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-800">{inv.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
                      </div>
                      {(cat || sq) && (
                        <p className="text-xs text-slate-400 mb-2">
                          {cat && <span style={{ color: cat.color }} className="font-medium">{cat.name}</span>}
                          {cat && sq && ' / '}
                          {sq && <span>{sq.text.length > 80 ? sq.text.slice(0, 80) + '…' : sq.text}</span>}
                        </p>
                      )}
                      {inv.content && (
                        <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">{inv.content}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">{insightCount(inv.id)} תובנות</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditing({ id: inv.id, title: inv.title, content: inv.content, status: inv.status, subQuestionId: inv.subQuestionId })}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      >✏</button>
                      <button
                        type="button"
                        onClick={() => { if (confirm(`למחוק חקירה "${inv.title}" וכל התובנות שלה?`)) deleteInvestigation(inv.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >🗑</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
