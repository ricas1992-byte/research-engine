import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../data/store';
import type { Axis, Status, Insight } from '../types/insight';
import { AxisBadge } from '../components/AxisBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TagInput } from '../components/TagInput';
import { CrossRefCard } from '../components/CrossRefCard';
import { InsightCard } from '../components/InsightCard';
import { generateId } from '../utils/id';
import { getRateLimitStatus } from '../utils/claude-api';

const ALL_AXES: Axis[] = ['כללי', 'תיאורטי', 'ביצועי', 'פסיכולוגי', 'מוסדי', 'פדגוגי'];
const ALL_STATUSES: Status[] = ['גולמי', 'מעובד', 'מוכן'];

const EMPTY_FORM: Omit<Insight, 'id' | 'createdAt' | 'updatedAt'> = {
  content: '',
  axis: 'כללי',
  status: 'גולמי',
  round: 1,
  tags: [],
  relatedInsights: [],
  sourceRefs: [],
  zachariasQuestion: '',
};

export function InsightEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { insights, sources, crossRefs, addInsight, updateInsight, deleteInsight, runSemanticAnalysis, analysis, deleteCrossRef } = useStore();

  const existing = id ? insights.find((i) => i.id === id) : undefined;
  const [form, setForm] = useState<Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>>(
    existing
      ? {
          content: existing.content,
          axis: existing.axis,
          status: existing.status,
          round: existing.round,
          tags: existing.tags,
          relatedInsights: existing.relatedInsights,
          sourceRefs: existing.sourceRefs,
          zachariasQuestion: existing.zachariasQuestion ?? '',
        }
      : EMPTY_FORM
  );
  const [rateStatus, setRateStatus] = useState({ remaining: 5, resetsIn: 0 });

  useEffect(() => {
    const interval = setInterval(() => setRateStatus(getRateLimitStatus()), 5000);
    return () => clearInterval(interval);
  }, []);

  // All existing tags for autocomplete
  const allTags = [...new Set(insights.flatMap((i) => i.tags))].sort();

  const thisInsightCrossRefs = id
    ? crossRefs.filter((r) => r.insightId === id || r.targetId === id)
    : [];

  const handleSave = () => {
    if (!form.content.trim()) return;
    const now = new Date().toISOString();
    if (existing && id) {
      updateInsight(id, { ...form });
    } else {
      addInsight({
        ...form,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      });
      navigate('/editor');
    }
  };

  const handleAIAnalysis = async () => {
    if (!id) {
      alert('שמור את התובנה קודם לפני ניתוח AI');
      return;
    }
    await runSemanticAnalysis(id);
  };

  const handleDelete = () => {
    if (!id || !window.confirm('מחק תובנה זו לצמיתות?')) return;
    deleteInsight(id);
    navigate('/editor');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 font-hebrew">
          {existing ? 'עריכת תובנה' : 'תובנה חדשה'}
        </h1>
        <div className="flex gap-2">
          {existing && (
            <button
              onClick={handleDelete}
              className="text-sm px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              מחק
            </button>
          )}
          <button
            onClick={handleAIAnalysis}
            disabled={analysis.isAnalyzing || rateStatus.remaining === 0}
            className="text-sm px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition-colors"
          >
            {analysis.isAnalyzing ? 'מנתח...' : 'נתח עם AI ✦'}
          </button>
          <button
            onClick={handleSave}
            disabled={!form.content.trim()}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            שמור
          </button>
        </div>
      </div>

      {rateStatus.remaining < 3 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-700">
          נותרו {rateStatus.remaining} קריאות AI בדקה זו
          {rateStatus.resetsIn > 0 && ` (מתאפס בעוד ${rateStatus.resetsIn} שניות)`}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Axis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ציר</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_AXES.map((axis) => (
              <button
                key={axis}
                type="button"
                onClick={() => setForm((f) => ({ ...f, axis }))}
                className={`transition-all ${form.axis === axis ? 'ring-2 ring-offset-1 ring-blue-500 rounded-full' : 'opacity-60 hover:opacity-100'}`}
              >
                <AxisBadge axis={axis} size="sm" />
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
          <div className="flex gap-1.5">
            {ALL_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status }))}
                className={`transition-all ${form.status === status ? 'ring-2 ring-offset-1 ring-blue-500 rounded-full' : 'opacity-60 hover:opacity-100'}`}
              >
                <StatusBadge status={status} size="sm" />
              </button>
            ))}
          </div>
        </div>

        {/* Round */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סבב</label>
          <input
            type="number"
            min={1}
            value={form.round}
            onChange={(e) => setForm((f) => ({ ...f, round: parseInt(e.target.value) || 1 }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תוכן התובנה</label>
        <textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          rows={5}
          placeholder="כתוב את התובנה כאן... השתמש ב'אימון' (לא 'תרגול') ו'פעמה'."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-hebrew"
          dir="rtl"
        />
        <p className="text-xs text-gray-400 mt-1">{form.content.length} תווים</p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תגיות</label>
        <TagInput
          tags={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
          suggestions={allTags}
        />
      </div>

      {/* Zacharia's question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          שאלת זכריה <span className="text-gray-400 font-normal">(אופציונלי)</span>
        </label>
        <input
          type="text"
          value={form.zachariasQuestion ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, zachariasQuestion: e.target.value }))}
          placeholder="מה האדם מבפנים לא רואה כאן?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          dir="rtl"
        />
      </div>

      {/* Cross-references for this insight */}
      {thisInsightCrossRefs.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">
            הצלבות קיימות ({thisInsightCrossRefs.length})
          </h2>
          <div className="space-y-3">
            {thisInsightCrossRefs.map((ref) => (
              <CrossRefCard
                key={ref.id}
                ref_={ref}
                insights={insights}
                sources={sources}
                onDelete={deleteCrossRef}
              />
            ))}
          </div>
        </div>
      )}

      {/* All insights list */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">כל התובנות ({insights.length})</h2>
        <div className="space-y-3">
          {insights
            .filter((i) => i.id !== id)
            .map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                compact
                connectionCount={crossRefs.filter((r) => r.insightId === insight.id || r.targetId === insight.id).length}
              />
            ))}
          {insights.length === 0 && (
            <p className="text-gray-400 text-center py-8">אין תובנות עדיין. הוסף את הראשונה!</p>
          )}
        </div>
      </div>
    </div>
  );
}
