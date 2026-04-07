import { useState } from 'react';
import { useStore } from '../data/store';
import type { Source, Axis, SourceType, Stance } from '../types/insight';
import { SourceCard } from '../components/SourceCard';
import { TagInput } from '../components/TagInput';
import { AxisBadge } from '../components/AxisBadge';
import { generateId } from '../utils/id';

const ALL_AXES: Axis[] = ['כללי', 'תיאורטי', 'ביצועי', 'פסיכולוגי', 'מוסדי', 'פדגוגי'];

const EMPTY_FORM: Omit<Source, 'id'> = {
  type: 'book',
  author: '',
  title: '',
  content: '',
  stance: 'neutral',
  axes: [],
  tags: [],
};

export function SourceManager() {
  const { sources, insights, crossRefs, addSource, updateSource, deleteSource } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Source, 'id'>>(EMPTY_FORM);
  const [filterStance, setFilterStance] = useState<Stance | ''>('');
  const [filterAxis, setFilterAxis] = useState<Axis | ''>('');
  const [showForm, setShowForm] = useState(false);

  const allTags = [...new Set(sources.flatMap((s) => s.tags))].sort();

  const filtered = sources.filter((src) => {
    if (filterStance && src.stance !== filterStance) return false;
    if (filterAxis && !src.axes.includes(filterAxis)) return false;
    return true;
  });

  const connectionCount = (id: string) =>
    crossRefs.filter((r) => r.targetId === id && r.targetKind === 'source').length;

  const handleEdit = (id: string) => {
    const src = sources.find((s) => s.id === id);
    if (!src) return;
    setEditing(id);
    setForm({ type: src.type, author: src.author, title: src.title, content: src.content, stance: src.stance, axes: src.axes, tags: src.tags });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.author.trim()) return;
    if (editing) {
      updateSource(editing, form);
      setEditing(null);
    } else {
      addSource({ ...form, id: generateId() });
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const toggleAxis = (axis: Axis) => {
    setForm((f) => ({
      ...f,
      axes: f.axes.includes(axis) ? f.axes.filter((a) => a !== axis) : [...f.axes, axis],
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-hebrew">מקורות</h1>
          <p className="text-gray-500 text-sm">{sources.length} מקורות | {crossRefs.filter(r => r.targetKind === 'source').length} הצלבות</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY_FORM); }}
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + מקור חדש
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800">{editing ? 'עריכת מקור' : 'מקור חדש'}</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם מחבר *</label>
              <input
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                placeholder="שם המחבר / מוסד"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">כותרת *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="כותרת הספר / מאמר"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SourceType }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="book">ספר</option>
                <option value="research">מחקר</option>
                <option value="quote">ציטוט</option>
                <option value="institutional">מסמך מוסדי</option>
                <option value="personal">אישי</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">עמדה</label>
              <div className="flex gap-2">
                {(['establishment', 'peripheral', 'neutral'] as Stance[]).map((stance) => (
                  <button
                    key={stance}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, stance }))}
                    className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
                      form.stance === stance
                        ? stance === 'establishment' ? 'bg-red-500 text-white border-red-500'
                          : stance === 'peripheral' ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-gray-500 text-white border-gray-500'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {stance === 'establishment' ? 'ממסד' : stance === 'peripheral' ? 'שולי' : 'ניטרלי'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ציטוט / תוכן</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={3}
              placeholder="ציטוט ישיר או סיכום קצר"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">צירים רלוונטיים</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_AXES.map((axis) => (
                <button
                  key={axis}
                  type="button"
                  onClick={() => toggleAxis(axis)}
                  className={`transition-all ${form.axes.includes(axis) ? 'ring-2 ring-offset-1 ring-blue-500 rounded-full' : 'opacity-50 hover:opacity-80'}`}
                >
                  <AxisBadge axis={axis} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תגיות</label>
            <TagInput
              tags={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
              suggestions={allTags}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.author.trim()}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              שמור מקור
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl p-3">
        <span className="text-sm text-gray-500">סינון:</span>
        <select
          value={filterStance}
          onChange={(e) => setFilterStance(e.target.value as Stance | '')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">כל העמדות</option>
          <option value="establishment">ממסד</option>
          <option value="peripheral">שולי/ביקורתי</option>
          <option value="neutral">ניטרלי</option>
        </select>
        <select
          value={filterAxis}
          onChange={(e) => setFilterAxis(e.target.value as Axis | '')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">כל הצירים</option>
          {ALL_AXES.map((axis) => <option key={axis} value={axis}>{axis}</option>)}
        </select>
        {(filterStance || filterAxis) && (
          <button
            onClick={() => { setFilterStance(''); setFilterAxis(''); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ✕ נקה
          </button>
        )}
        <span className="text-xs text-gray-400 mr-auto">{filtered.length} תוצאות</span>
      </div>

      {/* Sources list */}
      <div className="space-y-4">
        {filtered.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            connectionCount={connectionCount(source.id)}
            onEdit={handleEdit}
            onDelete={(id) => window.confirm('מחק מקור?') && deleteSource(id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📚</p>
            <p>אין מקורות. הוסף את הראשון!</p>
          </div>
        )}
      </div>
    </div>
  );
}
