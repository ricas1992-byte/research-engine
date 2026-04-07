import { useState } from 'react';
import { useStore } from '../data/store';
import type { ZachariaReport as ZRType } from '../types/analysis';
import { CROSSREF_LABELS } from '../utils/colors';
import { exportReportAsMarkdown, copyToClipboard } from '../utils/export';
import { callClaude } from '../utils/claude-api';
import { buildZachariaReportPrompt } from '../engine/prompts';
import { generateId } from '../utils/id';

export function ZachariaReport() {
  const { insights, crossRefs, blindSpots } = useStore();
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [report, setReport] = useState<ZRType | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const maxRound = Math.max(...insights.map((i) => i.round), 1);
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    const roundInsights = insights.filter((i) => i.round === selectedRound);
    const roundCrossRefs = crossRefs.filter((ref) =>
      roundInsights.some((i) => i.id === ref.insightId)
    );
    const roundBlindSpots = blindSpots.filter((bs) => !bs.resolvedBy);

    let aiResult: {
      newInsightsSummary: string;
      openQuestions: string[];
      suggestedTopics: string[];
    } | null = null;

    try {
      const prompt = buildZachariaReportPrompt(
        selectedRound,
        insights,
        roundCrossRefs.length,
        roundBlindSpots.length
      );
      const raw = await callClaude(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResult = JSON.parse(cleaned);
    } catch (err) {
      console.warn('AI generation failed, using deterministic fallback:', err);
    }

    const significantRefs = roundCrossRefs
      .filter((r) => r.type === 'contradicts' || r.type === 'blind_spot' || r.confidence > 0.7)
      .slice(0, 5);

    const newInsightsSummary =
      aiResult?.newInsightsSummary ??
      `בסבב ${selectedRound} נוספו ${roundInsights.length} תובנות. ` +
      `${roundInsights.filter((i) => i.status === 'מוכן').length} מוכנות, ` +
      `${roundInsights.filter((i) => i.status === 'מעובד').length} בעיבוד. ` +
      (roundBlindSpots.length > 0
        ? `זוהו ${roundBlindSpots.length} נקודות עיוורון הדורשות התייחסות.`
        : 'לא זוהו נקודות עיוורון חדשות.');

    const openQuestions = aiResult?.openQuestions ?? [
      ...roundInsights
        .filter((i) => i.zachariasQuestion)
        .map((i) => i.zachariasQuestion!)
        .slice(0, 3),
      ...roundBlindSpots
        .filter((bs) => bs.type === 'open_question')
        .map((bs) => bs.description)
        .slice(0, 2),
    ];

    const suggestedTopics = aiResult?.suggestedTopics ?? [
      ...roundBlindSpots
        .filter((bs) => bs.type === 'unchallenged_establishment')
        .map((bs) => `אתגור ממסדי: ${bs.axis}`)
        .slice(0, 2),
      ...roundBlindSpots
        .filter((bs) => bs.type === 'missing_coverage')
        .map((bs) => `הרחבת כיסוי: ${bs.axis}`)
        .slice(0, 2),
    ];

    setReport({
      id: generateId(),
      round: selectedRound,
      generatedAt: new Date().toISOString(),
      newInsightsSummary,
      significantCrossRefs: significantRefs,
      blindSpots: roundBlindSpots.slice(0, 6),
      openQuestions: openQuestions.filter(Boolean).slice(0, 5),
      suggestedTopics: suggestedTopics.filter(Boolean).slice(0, 4),
    });

    setGenerating(false);
  };

  const handleCopy = async () => {
    if (!report) return;
    const md = exportReportAsMarkdown(report);
    await copyToClipboard(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const md = exportReportAsMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zacharia-report-round-${report.round}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">דוח זכריה</h1>
          <p className="text-slate-400 text-sm">ניתוח ביקורתי לפי סבב — מה האדם מבפנים לא רואה?</p>
        </div>
        {report && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-sm px-3 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {copied ? '✓ הועתק' : 'העתק Markdown'}
            </button>
            <button
              onClick={handleDownload}
              className="text-sm px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              הורד .md
            </button>
          </div>
        )}
      </div>

      {/* Round selector + generate */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex items-end gap-4 shadow-card">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">בחר סבב</label>
          <select
            value={selectedRound}
            onChange={(e) => { setSelectedRound(parseInt(e.target.value)); setReport(null); }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"
          >
            {rounds.map((r) => (
              <option key={r} value={r}>
                סבב {r} — {insights.filter((i) => i.round === r).length} תובנות
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {generating ? 'מפיק...' : 'הפק דוח'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="space-y-5">
          {/* Report header */}
          <div className="bg-white border border-slate-200/80 border-r-4 border-r-amber-400 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-800">
                דוח סבב {report.round}
              </h2>
              <span className="text-xs text-slate-400">
                {new Date(report.generatedAt).toLocaleDateString('he-IL', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
            <p className="text-xs text-amber-500 font-semibold mb-3">ד"ר זכריה פלאבין — ניתוח ביקורתי</p>
            <p className="text-slate-700 leading-relaxed">{report.newInsightsSummary}</p>
          </div>

          {/* Significant cross-refs */}
          {report.significantCrossRefs.length > 0 && (
            <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-card">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center justify-center font-bold">
                  {report.significantCrossRefs.length}
                </span>
                הצלבות משמעותיות
              </h3>
              <div className="space-y-3">
                {report.significantCrossRefs.map((ref) => (
                  <div key={ref.id} className="border-r-4 pr-3 py-1" style={{
                    borderColor: ['contradicts', 'blind_spot'].includes(ref.type) ? '#ef4444' : '#6366f1',
                  }}>
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      {CROSSREF_LABELS[ref.type]}
                    </span>
                    <p className="text-sm text-slate-700 mt-0.5">{ref.explanation}</p>
                    <p className="text-xs text-amber-600 mt-1 italic">← {ref.zachpiracyQuestion}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Blind spots */}
          {report.blindSpots.length > 0 && (
            <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-card">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-red-100 text-red-700 text-xs rounded-full flex items-center justify-center font-bold">
                  {report.blindSpots.length}
                </span>
                נקודות עיוורון שהתגלו
              </h3>
              <div className="space-y-2">
                {report.blindSpots.map((bs) => (
                  <div
                    key={bs.id}
                    className={`rounded-lg px-3 py-2 border text-sm ${
                      bs.severity === 'high' ? 'bg-red-50 border-red-200 text-red-800'
                      : bs.severity === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-medium">[{bs.axis}]</span> {bs.description}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Open questions */}
          {report.openQuestions.length > 0 && (
            <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-card">
              <h3 className="font-semibold text-slate-800 mb-3">שאלות פתוחות</h3>
              <ul className="space-y-2">
                {report.openQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-amber-500 font-bold mt-0.5">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Suggested topics */}
          {report.suggestedTopics.length > 0 && (
            <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-card">
              <h3 className="font-semibold text-slate-800 mb-3">נושאים מוצעים לדיון הבא</h3>
              <ul className="space-y-2">
                {report.suggestedTopics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-indigo-500 font-bold mt-0.5">→</span>
                    {topic}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Raw Markdown preview */}
          <details className="bg-slate-50 border border-slate-200/80 rounded-xl">
            <summary className="px-4 py-3 cursor-pointer text-sm text-slate-500 hover:text-slate-700 select-none">
              תצוגה מקדימה של Markdown
            </summary>
            <pre className="px-4 pb-4 text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap" dir="ltr">
              {exportReportAsMarkdown(report)}
            </pre>
          </details>
        </div>
      )}

      {!report && !generating && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-lg">בחר סבב ולחץ "הפק דוח"</p>
          <p className="text-sm mt-1">הדוח ישלב ניתוח AI עם ממצאי המנוע</p>
        </div>
      )}
    </div>
  );
}
