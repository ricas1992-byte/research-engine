import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../data/store';
import type { InvestigationStatus, InsightStatus, RawMaterialType } from '../types/index';

const STATUS_OPTIONS: InvestigationStatus[] = ['גולמי', 'בעבודה', 'הושלמה'];
const INSIGHT_STATUS_OPTIONS: InsightStatus[] = ['גולמי', 'מעובד', 'מוכן'];

const STATUS_STYLE: Record<InvestigationStatus, string> = {
  גולמי:    'bg-slate-100 text-slate-600',
  בעבודה:  'bg-amber-100 text-amber-700',
  הושלמה: 'bg-emerald-100 text-emerald-700',
};

const INSIGHT_STATUS_STYLE: Record<InsightStatus, string> = {
  גולמי:    'bg-slate-100 text-slate-600',
  מעובד:   'bg-amber-100 text-amber-700',
  מוכן:    'bg-emerald-100 text-emerald-700',
};

const RAW_TYPE_OPTIONS: { value: RawMaterialType; label: string; icon: string }[] = [
  { value: 'doc',   label: 'מסמך',   icon: '📄' },
  { value: 'pdf',   label: 'PDF',    icon: '📋' },
  { value: 'audio', label: 'שמע',   icon: '🎵' },
  { value: 'image', label: 'תמונה', icon: '🖼️' },
  { value: 'other', label: 'קובץ',  icon: '📎' },
];

function detectMaterialType(url: string): RawMaterialType {
  const lower = url.toLowerCase();
  if (
    lower.includes('docs.google.com/document') ||
    lower.includes('docs.google.com/presentation') ||
    lower.includes('docs.google.com/spreadsheets')
  ) return 'doc';
  if (lower.includes('.pdf') || lower.includes('/pdf')) return 'pdf';
  if (
    lower.includes('.mp3') || lower.includes('.wav') || lower.includes('.m4a') ||
    lower.includes('.ogg') || lower.includes('.flac') ||
    lower.includes('soundcloud.com') || lower.includes('spotify.com')
  ) return 'audio';
  if (
    lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') ||
    lower.includes('.gif') || lower.includes('.webp') || lower.includes('.svg')
  ) return 'image';
  return 'other';
}

export function InvestigationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    categories, subQuestions, investigations, insights,
    updateInvestigation, deleteInvestigation,
    addInsight, updateInsight, deleteInsight,
    addRawMaterial, deleteRawMaterial,
    addSourceExcerpt, sourceExcerpts, deleteSourceExcerpt, updateSourceExcerpt,
  } = useStore();

  const inv = investigations.find((i) => i.id === id);
  const sq = inv ? subQuestions.find((s) => s.id === inv.subQuestionId) : null;
  const cat = sq ? categories.find((c) => c.id === sq.categoryId) : null;
  const invInsights = insights.filter((ins) => ins.investigationId === id);
  const invExcerpts = sourceExcerpts.filter((e) => e.investigationId === id);

  // ── Edit state ────────────────────────────────────────────
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState(inv?.title ?? '');
  const [editContent, setEditContent] = useState(false);
  const [content, setContent] = useState(inv?.content ?? '');
  const [editFindings, setEditFindings] = useState(false);
  const [findings, setFindings] = useState(inv?.findings ?? '');
  const [status, setStatus] = useState<InvestigationStatus>(inv?.status ?? 'גולמי');

  // ── Insight state ─────────────────────────────────────────
  const [showAddInsight, setShowAddInsight] = useState(false);
  const [newInsightText, setNewInsightText] = useState('');
  const [newInsightStatus, setNewInsightStatus] = useState<InsightStatus>('גולמי');
  const [editingInsightId, setEditingInsightId] = useState<string | null>(null);
  const [editingInsightText, setEditingInsightText] = useState('');
  const [editingInsightStatus, setEditingInsightStatus] = useState<InsightStatus>('גולמי');

  // ── Raw material state ────────────────────────────────────
  const [showAddRaw, setShowAddRaw] = useState(false);
  const [rmUrl, setRmUrl] = useState('');
  const [rmTitle, setRmTitle] = useState('');
  const [rmNotes, setRmNotes] = useState('');
  const [rmType, setRmType] = useState<RawMaterialType>('other');

  // ── Excerpt state ─────────────────────────────────────────
  const [addExcerptFor, setAddExcerptFor] = useState<string | null>(null); // materialId
  const [excerptText, setExcerptText] = useState('');
  const [excerptNotes, setExcerptNotes] = useState('');
  const [editingExcerptId, setEditingExcerptId] = useState<string | null>(null);
  const [editingExcerptText, setEditingExcerptText] = useState('');
  const [editingExcerptNotes, setEditingExcerptNotes] = useState('');

  if (!inv) {
    return (
      <div className="p-8 text-center text-slate-400" dir="rtl">
        <p className="text-lg mb-4">חקירה לא נמצאה</p>
        <button
          type="button"
          onClick={() => navigate('/investigations')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          חזרה לחקירות
        </button>
      </div>
    );
  }

  // ── Save handlers ─────────────────────────────────────────
  const saveTitle = () => {
    if (title.trim()) updateInvestigation(inv.id, { title: title.trim() });
    setEditTitle(false);
  };

  const saveContent = () => {
    updateInvestigation(inv.id, { content: content.trim() });
    setEditContent(false);
  };

  const saveFindings = () => {
    updateInvestigation(inv.id, { findings: findings.trim() || undefined });
    setEditFindings(false);
  };

  const saveStatus = (s: InvestigationStatus) => {
    setStatus(s);
    updateInvestigation(inv.id, { status: s });
  };

  // ── Insight handlers ──────────────────────────────────────
  const handleAddInsight = () => {
    if (!newInsightText.trim()) return;
    addInsight({ investigationId: inv.id, text: newInsightText.trim(), status: newInsightStatus });
    setNewInsightText('');
    setNewInsightStatus('גולמי');
    setShowAddInsight(false);
  };

  const handleUpdateInsight = (insightId: string) => {
    if (!editingInsightText.trim()) return;
    updateInsight(insightId, { text: editingInsightText.trim(), status: editingInsightStatus });
    setEditingInsightId(null);
  };

  // ── Raw material handlers ─────────────────────────────────
  const handleSaveRaw = () => {
    if (!rmUrl.trim() || !rmTitle.trim()) return;
    addRawMaterial(inv.id, {
      title: rmTitle.trim(),
      url: rmUrl.trim(),
      source: 'gdrive',
      type: rmType,
      notes: rmNotes.trim() || undefined,
    });
    setShowAddRaw(false);
    setRmUrl(''); setRmTitle(''); setRmNotes(''); setRmType('other');
  };

  const handleUrlChange = (url: string) => {
    setRmUrl(url);
    setRmType(detectMaterialType(url));
  };

  // ── Excerpt handlers ──────────────────────────────────────
  const handleSaveExcerpt = (materialId: string, materialTitle: string) => {
    if (!excerptText.trim()) return;
    addSourceExcerpt({
      quotedText: excerptText.trim(),
      materialId,
      materialTitle,
      investigationId: inv.id,
      investigationTitle: inv.title,
      notes: excerptNotes.trim() || undefined,
    });
    setAddExcerptFor(null);
    setExcerptText('');
    setExcerptNotes('');
  };

  const handleUpdateExcerpt = (excerptId: string) => {
    if (!editingExcerptText.trim()) return;
    updateSourceExcerpt(excerptId, {
      quotedText: editingExcerptText.trim(),
      notes: editingExcerptNotes.trim() || undefined,
    });
    setEditingExcerptId(null);
  };

  const rawMaterials = inv.rawMaterials ?? [];
  const typeInfo = (type: RawMaterialType) =>
    RAW_TYPE_OPTIONS.find((o) => o.value === type) ?? RAW_TYPE_OPTIONS[4];

  return (
    <div className="min-h-full bg-slate-50" dir="rtl">
      {/* ─── Breadcrumb + Back ───────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-medium"
        >
          ← חזרה
        </button>
        <span className="text-slate-300 mx-1">/</span>
        <Link to="/investigations" className="text-slate-500 hover:text-indigo-600">
          חקירות
        </Link>
        {cat && (
          <>
            <span className="text-slate-300 mx-1">/</span>
            <span style={{ color: cat.color }} className="font-medium">{cat.name}</span>
          </>
        )}
        {sq && (
          <>
            <span className="text-slate-300 mx-1">/</span>
            <span className="text-slate-500 truncate max-w-xs">
              {sq.text.length > 50 ? sq.text.slice(0, 50) + '…' : sq.text}
            </span>
          </>
        )}
        <span className="text-slate-300 mx-1">/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs">{inv.title}</span>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">

        {/* ─── Title + Status ──────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              {editTitle ? (
                <div className="flex gap-2 items-start">
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditTitle(false); }}
                    className="flex-1 text-2xl font-bold border-b-2 border-indigo-500 bg-transparent outline-none pb-1"
                  />
                  <button type="button" onClick={saveTitle} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm mt-1">שמור</button>
                  <button type="button" onClick={() => { setTitle(inv.title); setEditTitle(false); }} className="px-3 py-1 text-slate-500 rounded text-sm mt-1 hover:bg-slate-100">ביטול</button>
                </div>
              ) : (
                <button
                  type="button"
                  className="text-2xl font-bold text-slate-800 text-right w-full hover:text-indigo-700 group flex items-center gap-2"
                  onClick={() => { setTitle(inv.title); setEditTitle(true); }}
                >
                  {inv.title}
                  <span className="opacity-0 group-hover:opacity-100 text-base text-slate-400">✏</span>
                </button>
              )}

              {/* Context */}
              {(cat || sq) && (
                <p className="text-sm text-slate-400 mt-2">
                  {cat && <span style={{ color: cat.color }} className="font-medium">{cat.name}</span>}
                  {cat && sq && <span className="mx-1">·</span>}
                  {sq && <span>{sq.text}</span>}
                </p>
              )}
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => {
                if (confirm(`למחוק חקירה "${inv.title}" וכל התובנות שלה?`)) {
                  deleteInvestigation(inv.id);
                  navigate('/investigations');
                }
              }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
              title="מחק חקירה"
            >
              🗑
            </button>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs text-slate-500 font-medium">סטטוס:</span>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => saveStatus(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    status === s
                      ? STATUS_STYLE[s] + ' border-current ring-1 ring-current'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Description / Research Question ────────────────── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700">תיאור ושאלת מחקר</h2>
            {!editContent && (
              <button
                type="button"
                onClick={() => { setContent(inv.content); setEditContent(true); }}
                className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1"
              >
                ✏ ערוך
              </button>
            )}
          </div>
          {editContent ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                placeholder="תאר את החקירה, שאלת המחקר, המטרה..."
              />
              <div className="flex gap-2">
                <button type="button" onClick={saveContent} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">שמור</button>
                <button type="button" onClick={() => setEditContent(false)} className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100">ביטול</button>
              </div>
            </div>
          ) : inv.content ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{inv.content}</p>
          ) : (
            <button
              type="button"
              onClick={() => { setContent(''); setEditContent(true); }}
              className="text-sm text-slate-400 hover:text-indigo-600 italic"
            >
              לחץ להוספת תיאור...
            </button>
          )}
        </section>

        {/* ─── Findings / Notes ───────────────────────────────── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700">ממצאים והערות</h2>
            {!editFindings && (
              <button
                type="button"
                onClick={() => { setFindings(inv.findings ?? ''); setEditFindings(true); }}
                className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1"
              >
                ✏ ערוך
              </button>
            )}
          </div>
          {editFindings ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                rows={6}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                placeholder="רשום ממצאים, תובנות ראשוניות, הערות שדה..."
              />
              <div className="flex gap-2">
                <button type="button" onClick={saveFindings} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">שמור</button>
                <button type="button" onClick={() => setEditFindings(false)} className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100">ביטול</button>
              </div>
            </div>
          ) : inv.findings ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{inv.findings}</p>
          ) : (
            <button
              type="button"
              onClick={() => { setFindings(''); setEditFindings(true); }}
              className="text-sm text-slate-400 hover:text-indigo-600 italic"
            >
              לחץ להוספת ממצאים...
            </button>
          )}
        </section>

        {/* ─── Insights ───────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">
              תובנות
              <span className="mr-2 text-xs font-normal text-slate-400">({invInsights.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowAddInsight(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + הוסף תובנה
            </button>
          </div>

          {showAddInsight && (
            <div className="bg-slate-50 border border-indigo-200 rounded-lg p-4 mb-4 space-y-3">
              <textarea
                autoFocus
                value={newInsightText}
                onChange={(e) => setNewInsightText(e.target.value)}
                placeholder="תאר את התובנה..."
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">סטטוס:</span>
                {INSIGHT_STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewInsightStatus(s)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      newInsightStatus === s
                        ? INSIGHT_STATUS_STYLE[s] + ' border-current'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleAddInsight} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">שמור</button>
                <button type="button" onClick={() => { setShowAddInsight(false); setNewInsightText(''); }} className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100">ביטול</button>
              </div>
            </div>
          )}

          {invInsights.length === 0 && !showAddInsight && (
            <p className="text-sm text-slate-400 italic text-center py-4">אין תובנות עדיין לחקירה זו</p>
          )}

          <div className="space-y-3">
            {invInsights.map((ins) => (
              <div key={ins.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50">
                {editingInsightId === ins.id ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={editingInsightText}
                      onChange={(e) => setEditingInsightText(e.target.value)}
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">סטטוס:</span>
                      {INSIGHT_STATUS_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditingInsightStatus(s)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            editingInsightStatus === s
                              ? INSIGHT_STATUS_STYLE[s] + ' border-current'
                              : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleUpdateInsight(ins.id)} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700">שמור</button>
                      <button type="button" onClick={() => setEditingInsightId(null)} className="px-3 py-1 text-slate-600 rounded text-xs hover:bg-slate-100">ביטול</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 leading-relaxed">{ins.text}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${INSIGHT_STATUS_STYLE[ins.status]}`}>
                        {ins.status}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => { setEditingInsightId(ins.id); setEditingInsightText(ins.text); setEditingInsightStatus(ins.status); }}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded text-sm"
                      >✏</button>
                      <button
                        type="button"
                        onClick={() => { if (confirm('למחוק תובנה זו?')) deleteInsight(ins.id); }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded text-sm"
                      >🗑</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Raw Materials + Source Excerpts ────────────────── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">
              חומרי גלם ומקורות
              <span className="mr-2 text-xs font-normal text-slate-400">
                ({rawMaterials.length} מקורות · {invExcerpts.length} ציטוטים)
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setShowAddRaw(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + הוסף חומר גלם
            </button>
          </div>

          {/* Add raw material form */}
          {showAddRaw && (
            <div className="bg-slate-50 border border-indigo-200 rounded-lg p-4 mb-4 space-y-3">
              <input
                autoFocus
                value={rmUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="הדבק קישור (Google Drive, Docs, וכו')"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dir="ltr"
              />
              <div className="flex gap-2">
                <input
                  value={rmTitle}
                  onChange={(e) => setRmTitle(e.target.value)}
                  placeholder="כותרת"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={rmType}
                  onChange={(e) => setRmType(e.target.value as RawMaterialType)}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {RAW_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
                  ))}
                </select>
              </div>
              <input
                value={rmNotes}
                onChange={(e) => setRmNotes(e.target.value)}
                placeholder="הערה (אופציונלי)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveRaw}
                  disabled={!rmUrl.trim() || !rmTitle.trim()}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-40"
                >
                  שמור
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddRaw(false); setRmUrl(''); setRmTitle(''); setRmNotes(''); setRmType('other'); }}
                  className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          {rawMaterials.length === 0 && !showAddRaw && (
            <p className="text-sm text-slate-400 italic text-center py-4">אין חומרי גלם עדיין</p>
          )}

          {/* Materials list with excerpts */}
          <div className="space-y-4">
            {rawMaterials.map((mat) => {
              const info = typeInfo(mat.type);
              const matExcerpts = invExcerpts.filter((e) => e.materialId === mat.id);
              const isAddingExcerpt = addExcerptFor === mat.id;

              return (
                <div key={mat.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Material header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                    <span className="text-base flex-shrink-0">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-700 hover:underline truncate block"
                      >
                        {mat.title}
                      </a>
                      {mat.notes && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{mat.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAddExcerptFor(mat.id);
                          setExcerptText('');
                          setExcerptNotes('');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2.5 py-1 rounded-md hover:bg-indigo-50 border border-indigo-200"
                      >
                        + ציטוט
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (confirm(`למחוק "${mat.title}"?`)) deleteRawMaterial(inv.id, mat.id); }}
                        className="p-1 text-slate-300 hover:text-red-500 rounded"
                        title="מחק מקור"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Add excerpt form */}
                  {isAddingExcerpt && (
                    <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 space-y-2">
                      <p className="text-xs font-medium text-amber-700">גזירת ציטוט מ‑{mat.title}</p>
                      <textarea
                        autoFocus
                        value={excerptText}
                        onChange={(e) => setExcerptText(e.target.value)}
                        placeholder="הדבק או הקלד את הקטע המצוטט..."
                        rows={4}
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-white"
                      />
                      <input
                        value={excerptNotes}
                        onChange={(e) => setExcerptNotes(e.target.value)}
                        placeholder="הערה לציטוט (אופציונלי)"
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveExcerpt(mat.id, mat.title)}
                          disabled={!excerptText.trim()}
                          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-40"
                        >
                          שמור ציטוט
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddExcerptFor(null); setExcerptText(''); setExcerptNotes(''); }}
                          className="px-3 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Excerpts list */}
                  {matExcerpts.length > 0 && (
                    <div className="px-4 py-3 border-t border-slate-100 space-y-2">
                      {matExcerpts.map((excerpt) => (
                        <div key={excerpt.id} className="bg-amber-50 border-r-4 border-amber-300 rounded-lg px-4 py-3">
                          {editingExcerptId === excerpt.id ? (
                            <div className="space-y-2">
                              <textarea
                                autoFocus
                                value={editingExcerptText}
                                onChange={(e) => setEditingExcerptText(e.target.value)}
                                rows={3}
                                className="w-full border border-amber-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                              />
                              <input
                                value={editingExcerptNotes}
                                onChange={(e) => setEditingExcerptNotes(e.target.value)}
                                placeholder="הערה"
                                className="w-full border border-amber-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleUpdateExcerpt(excerpt.id)} className="px-3 py-1 bg-amber-500 text-white rounded text-xs">שמור</button>
                                <button type="button" onClick={() => setEditingExcerptId(null)} className="px-3 py-1 text-slate-600 rounded text-xs hover:bg-slate-100">ביטול</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="text-sm text-slate-700 italic leading-relaxed">
                                  "{excerpt.quotedText}"
                                </p>
                                {excerpt.notes && (
                                  <p className="text-xs text-slate-500 mt-1">{excerpt.notes}</p>
                                )}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingExcerptId(excerpt.id);
                                    setEditingExcerptText(excerpt.quotedText);
                                    setEditingExcerptNotes(excerpt.notes ?? '');
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded text-xs"
                                >✏</button>
                                <button
                                  type="button"
                                  onClick={() => { if (confirm('למחוק ציטוט זה?')) deleteSourceExcerpt(excerpt.id); }}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded text-xs"
                                >🗑</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Metadata ───────────────────────────────────────── */}
        <div className="text-xs text-slate-400 text-center pb-4">
          נוצר: {new Date(inv.createdAt).toLocaleDateString('he-IL')} ·{' '}
          עודכן: {new Date(inv.updatedAt).toLocaleDateString('he-IL')}
        </div>
      </div>
    </div>
  );
}
