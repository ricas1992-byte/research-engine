import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../data/store';

export function SourcesView() {
  const {
    sourceExcerpts, investigations, categories, subQuestions,
    deleteSourceExcerpt, updateSourceExcerpt,
  } = useStore();

  const [filterInvId, setFilterInvId] = useState('');
  const [filterMatId, setFilterMatId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingNotes, setEditingNotes] = useState('');

  // Collect all unique materials from all investigations
  const allMaterials = investigations.flatMap((inv) =>
    (inv.rawMaterials ?? []).map((mat) => ({ ...mat, investigationId: inv.id }))
  );
  const uniqueMaterials = Array.from(
    new Map(allMaterials.map((m) => [m.id, m])).values()
  );

  const filtered = sourceExcerpts.filter((e) => {
    if (filterInvId && e.investigationId !== filterInvId) return false;
    if (filterMatId && e.materialId !== filterMatId) return false;
    return true;
  });

  // Build display context for each investigation
  const invContext = (invId: string) => {
    const inv = investigations.find((i) => i.id === invId);
    if (!inv) return { title: '—', catColor: '#94a3b8', sqText: '' };
    const sq = subQuestions.find((s) => s.id === inv.subQuestionId);
    const cat = sq ? categories.find((c) => c.id === sq.categoryId) : null;
    return { title: inv.title, catColor: cat?.color ?? '#94a3b8', sqText: sq?.text ?? '' };
  };

  const handleUpdate = (id: string) => {
    if (!editingText.trim()) return;
    updateSourceExcerpt(id, {
      quotedText: editingText.trim(),
      notes: editingNotes.trim() || undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">מקורות וציטוטים</h1>
          <p className="text-sm text-slate-500 mt-1">
            {sourceExcerpts.length} ציטוטים נגזרו מחומרי הגלם
          </p>
        </div>
      </div>

      {/* Filters */}
      {sourceExcerpts.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <select
            value={filterInvId}
            onChange={(e) => { setFilterInvId(e.target.value); setFilterMatId(''); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">כל החקירות</option>
            {investigations
              .filter((inv) => sourceExcerpts.some((e) => e.investigationId === inv.id))
              .map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.title.length > 60 ? inv.title.slice(0, 60) + '…' : inv.title}
                </option>
              ))}
          </select>

          <select
            value={filterMatId}
            onChange={(e) => setFilterMatId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">כל חומרי הגלם</option>
            {uniqueMaterials
              .filter((m) => sourceExcerpts.some((e) => e.materialId === m.id))
              .map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.title.length > 60 ? mat.title.slice(0, 60) + '…' : mat.title}
                </option>
              ))}
          </select>

          {(filterInvId || filterMatId) && (
            <button
              type="button"
              onClick={() => { setFilterInvId(''); setFilterMatId(''); }}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              נקה סינון
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {sourceExcerpts.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-4">📎</p>
          <p className="text-base font-medium mb-1">אין ציטוטים עדיין</p>
          <p className="text-sm">
            פתח חקירה, הוסף חומר גלם, ולחץ "+ ציטוט" כדי לגזור קטע
          </p>
        </div>
      )}

      {filtered.length === 0 && sourceExcerpts.length > 0 && (
        <p className="text-slate-400 text-sm text-center py-8">אין ציטוטים לפי הסינון הנוכחי</p>
      )}

      {/* Excerpts list */}
      <div className="space-y-4">
        {filtered.map((excerpt) => {
          const ctx = invContext(excerpt.investigationId);
          const isEditing = editingId === excerpt.id;

          return (
            <div key={excerpt.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Excerpt header */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="font-medium">מקור:</span>
                  <span className="text-slate-700 font-medium">{excerpt.materialTitle}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium">חקירה:</span>
                  <Link
                    to={`/investigations/${excerpt.investigationId}`}
                    className="hover:underline font-medium"
                    style={{ color: ctx.catColor }}
                  >
                    {ctx.title}
                  </Link>
                </div>
                <div className="flex gap-1">
                  {!isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(excerpt.id);
                          setEditingText(excerpt.quotedText);
                          setEditingNotes(excerpt.notes ?? '');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
                        title="ערוך"
                      >
                        ✏
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('למחוק ציטוט זה?')) deleteSourceExcerpt(excerpt.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="מחק"
                      >
                        🗑
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Excerpt body */}
              <div className="px-5 py-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={4}
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                    <input
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="הערה"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate(excerpt.id)}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                      >
                        שמור
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <blockquote className="border-r-4 border-amber-300 pr-4 text-sm text-slate-700 italic leading-relaxed">
                      "{excerpt.quotedText}"
                    </blockquote>
                    {excerpt.notes && (
                      <p className="mt-2 text-xs text-slate-500">{excerpt.notes}</p>
                    )}
                    <p className="mt-3 text-xs text-slate-400">
                      נוסף: {new Date(excerpt.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </>
                )}
              </div>

              {/* Links */}
              {!isEditing && (
                <div className="px-5 py-3 border-t border-slate-100 flex gap-4 text-xs">
                  <Link
                    to={`/investigations/${excerpt.investigationId}`}
                    className="text-indigo-600 hover:underline"
                  >
                    → עבור לחקירה
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
