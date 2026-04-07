import type { Insight, Source, CrossReference } from '../types/insight';
import type { BlindSpot, ZachariaReport } from '../types/analysis';
import { CROSSREF_LABELS } from './colors';

export function exportDataAsJSON(data: {
  insights: Insight[];
  sources: Source[];
  crossRefs: CrossReference[];
  blindSpots: BlindSpot[];
}): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `research-engine-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportAsMarkdown(report: ZachariaReport): string {
  const date = new Date(report.generatedAt).toLocaleDateString('he-IL');
  const refs = report.significantCrossRefs
    .map((r) => `- **${CROSSREF_LABELS[r.type]}**: ${r.explanation}\n  > ${r.zachpiracyQuestion}`)
    .join('\n');
  const spots = report.blindSpots
    .map((bs) => `- [${bs.severity}] ${bs.description}`)
    .join('\n');
  const questions = report.openQuestions.map((q) => `- ${q}`).join('\n');
  const topics = report.suggestedTopics.map((t) => `- ${t}`).join('\n');

  return `# דוח זכריה — סבב ${report.round}
**תאריך:** ${date}

## סיכום התפתחויות
${report.newInsightsSummary}

## הצלבות משמעותיות
${refs || '_אין הצלבות משמעותיות_'}

## נקודות עיוורון שהתגלו
${spots || '_לא זוהו נקודות עיוורון_'}

## שאלות פתוחות
${questions || '_אין שאלות פתוחות_'}

## נושאים מוצעים לדיון הבא
${topics || '_אין הצעות_'}

---
_הופק על ידי מנוע המחקר של יותם_`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
