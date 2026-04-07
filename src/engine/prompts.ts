import type { Insight, Source } from '../types/insight';

export function buildCrossRefPrompt(insight: Insight, target: Insight | Source, targetKind: 'insight' | 'source'): string {
  const targetBlock =
    targetKind === 'source'
      ? `מקור: "${(target as Source).title}" מאת ${(target as Source).author}
תוכן: ${target.content}
עמדה: ${(target as Source).stance}`
      : `תובנה: ${(target as Insight).content}
ציר: ${(target as Insight).axis} | סבב: ${(target as Insight).round}`;

  return `אתה חוקר ביקורתי בתחום פדגוגיית הפסנתר. תפקידך לנתח קשרים נסתרים בין תובנות ומקורות.

תובנה נבדקת:
${insight.content}
ציר: ${insight.axis} | סבב: ${insight.round} | סטטוס: ${insight.status}

${targetBlock}

נתח את הקשר בין השניים.
חשוב: ענה ב-JSON בלבד, ללא markdown, ללא הסברים מחוץ ל-JSON.

{
  "type": "supports | contradicts | extends | blind_spot | pattern",
  "explanation": "הסבר בעברית, 2-3 משפטים, ספציפי לתוכן",
  "zachpiracyQuestion": "מה האדם מבפנים לא רואה כאן? — משפט אחד חד",
  "confidence": 0.0
}`;
}

export function buildBlindSpotPrompt(insights: Insight[], sources: Source[]): string {
  const summary = insights.map((ins) => `[${ins.axis}] ${ins.content.slice(0, 80)}`).join('\n');
  const sourceSummary = sources.map((src) => `[${src.stance}] ${src.author}: ${src.title}`).join('\n');

  return `אתה חוקר ביקורתי. בדוק את מערכת התובנות הבאה ומצא נקודות עיוורון.

תובנות קיימות:
${summary}

מקורות זמינים:
${sourceSummary}

זהה 3-5 נקודות עיוורון קריטיות. ענה ב-JSON בלבד:
{
  "blindSpots": [
    {
      "type": "missing_coverage | unresolved_contradiction | open_question | unchallenged_establishment",
      "axis": "כללי | תיאורטי | ביצועי | פסיכולוגי | מוסדי | פדגוגי",
      "description": "תיאור בעברית",
      "severity": "low | medium | high"
    }
  ]
}`;
}

export function buildZachariaReportPrompt(
  round: number,
  insights: Insight[],
  newCrossRefs: number,
  blindSpotCount: number
): string {
  const roundInsights = insights.filter((ins) => ins.round === round);
  const summary = roundInsights.map((ins) => `- [${ins.axis}] ${ins.content}`).join('\n');

  return `אתה ד"ר זכריה פלאבין, מנטור מחקרי ביקורתי. יותם מציג בפניך את תוצאות סבב ${round}.

תובנות מהסבב:
${summary || 'אין תובנות בסבב זה'}

סטטיסטיקות: ${roundInsights.length} תובנות חדשות | ${newCrossRefs} הצלבות | ${blindSpotCount} נקודות עיוורון

הפק דוח ביקורתי. ענה ב-JSON בלבד:
{
  "newInsightsSummary": "סיכום קצר בעברית, 3-4 משפטים",
  "openQuestions": ["שאלה 1", "שאלה 2", "שאלה 3"],
  "suggestedTopics": ["נושא להעמקה 1", "נושא להעמקה 2"],
  "zachariasQuestion": "שאלת זכריה המרכזית לסבב הבא — שאלה אחת חדה"
}`;
}
