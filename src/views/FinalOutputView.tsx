import { useState } from 'react';
import { useStore } from '../data/store';
type EditForm = {
  id: string;
  title: string;
  content: string;
  format: string;
  linkedInsights: string[];
} | null;

export function FinalOutputView() {
  const { finalOutputs, insights, investigations, subQuestions, categories, addFinalOutput, updateFinalOutput, deleteFinalOutput } = useStore();

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFormat, setNewFormat] = useState('');
  const [newLinked, setNewLinked] = useState<string[]>([]);

  const [editing, setEditing] = useState<EditForm>(null);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addFinalOutput({ title: newTitle.trim(), content: newContent.trim(), format: newFormat.trim(), linkedInsights: newLinked });
    setNewTitle(''); setNewContent(''); setNewFormat(''); setNewLinked([]);
    setShowAdd(false);
  };

  const handleUpdate = () => {
    if (!editing || !editing.title.trim()) return;
    updateFinalOutput(editing.id, { title: editing.title.trim(), content: editing.content.trim(), format: editing.format.trim(), linkedInsights: editing.linkedInsights });
    setEditing(null);
  };

  const toggleInsight = (id: string, linked: string[], setLinked: (v: string[]) => void) => {
    setLinked(linked.includes(id) ? linked.filter((l) => l !== id) : [...linked, id]);
  };

  const getInsightContext = (insId: string) => {
    const ins = insights.find((i) => i.id === insId);
    if (!ins) return null;
    const inv = investigations.find((i) => i.id === ins.investigationId);
    return { ins, inv };
  };

  function InsightPicker({
    linked,
    setLinked,
  }: {
    linked: string[];
    setLinked: (v: string[]) => void;
  }) {
    return (
      <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
        {insights.length === 0 ? (
          <p className="text-xs text-slate-400 p-2">אין תובנות עדיין</p>
        ) : (
          insights.map((ins) => {
            const inv = investigations.find((i) => i.id === ins.investigationId);
            const sq = inv ? subQuestions.find((s) => s.id === inv.subQuestionId) : null;
            const cat = sq ? categories.find((c) => c.id === sq.categoryId) : null;
            const isLinked = linked.includes(ins.id);
            return (
              <label
                key={ins.id}
                className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-50 ${isLinked ? 'bg-indigo-50' : ''}`}
              >
                <input
                  type="checkbox"
                  title="קשר תובנה זו לתוצר"
                  checked={isLinked}
                  onChange={() => toggleInsight(ins.id, linked, setLinked)}
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-700 leading-tight">{ins.text.length > 100 ? ins.text.slice(0, 100) + '…' : ins.text}</p>
                  {(cat || inv) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cat && <span style={{ color: cat.color }}>{cat.name}</span>}
                      {cat && inv && ' / '}
                      {inv && inv.title}
                    </p>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">תוצר סופי</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + תוצר חדש
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800">תוצר חדש</h3>
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="כותרת"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={newFormat}
            onChange={(e) => setNewFormat(e.target.value)}
            placeholder="פורמט (חופשי — מאמר, שיר, פודקאסט, שיחה...)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="תוכן"
            rows={6}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <div>
            <p className="text-xs text-slate-500 mb-1.5">קשר תובנות ({newLinked.length} נבחרו)</p>
            <InsightPicker linked={newLinked} setLinked={setNewLinked} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">שמור</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100">ביטול</button>
          </div>
        </div>
      )}

      {finalOutputs.length === 0 && !showAdd && (
        <p className="text-slate-400 text-sm text-center py-8">אין תוצרים סופיים עדיין.</p>
      )}

      <div className="space-y-4">
        {finalOutputs.map((fo) => {
          const isEditing = editing?.id === fo.id;
          return (
            <div key={fo.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {isEditing ? (
                <div className="p-5 space-y-4">
                  <input
                    autoFocus
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    value={editing.format}
                    onChange={(e) => setEditing({ ...editing, format: e.target.value })}
                    placeholder="פורמט"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    placeholder="תוכן"
                    rows={6}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">קשר תובנות ({editing.linkedInsights.length} נבחרו)</p>
                    <InsightPicker
                      linked={editing.linkedInsights}
                      setLinked={(v) => setEditing({ ...editing, linkedInsights: v })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleUpdate} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">שמור</button>
                    <button type="button" onClick={() => setEditing(null)} className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100">ביטול</button>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-800">{fo.title}</h3>
                        {fo.format && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{fo.format}</span>
                        )}
                      </div>
                      {fo.content && (
                        <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4 mt-1">{fo.content}</p>
                      )}
                      {fo.linkedInsights.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-slate-400 font-medium">תובנות מקושרות ({fo.linkedInsights.length})</p>
                          {fo.linkedInsights.slice(0, 3).map((id) => {
                            const ctx = getInsightContext(id);
                            if (!ctx) return null;
                            return (
                              <p key={id} className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1 truncate">
                                💡 {ctx.ins.text.length > 80 ? ctx.ins.text.slice(0, 80) + '…' : ctx.ins.text}
                              </p>
                            );
                          })}
                          {fo.linkedInsights.length > 3 && (
                            <p className="text-xs text-slate-400">ועוד {fo.linkedInsights.length - 3}...</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditing({ id: fo.id, title: fo.title, content: fo.content, format: fo.format, linkedInsights: fo.linkedInsights })}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      >✏</button>
                      <button
                        type="button"
                        onClick={() => { if (confirm(`למחוק תוצר "${fo.title}"?`)) deleteFinalOutput(fo.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >🗑</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
