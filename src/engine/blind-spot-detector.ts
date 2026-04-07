import type { Insight, Source, CrossReference, Axis } from '../types/insight';
import type { BlindSpot } from '../types/analysis';
import { generateId } from '../utils/id';

const ALL_AXES: Axis[] = ['כללי', 'תיאורטי', 'ביצועי', 'פסיכולוגי', 'מוסדי', 'פדגוגי'];

export function detectBlindSpots(
  insights: Insight[],
  sources: Source[],
  crossRefs: CrossReference[]
): BlindSpot[] {
  const spots: BlindSpot[] = [];
  const now = new Date().toISOString();

  // 1. AXIS COVERAGE — any axis with < 20% of average
  const axisCounts: Record<Axis, number> = {
    כללי: 0, תיאורטי: 0, ביצועי: 0, פסיכולוגי: 0, מוסדי: 0, פדגוגי: 0,
  };
  for (const ins of insights) {
    axisCounts[ins.axis]++;
  }
  const avg = insights.length / ALL_AXES.length;
  const threshold = avg * 0.2;
  for (const axis of ALL_AXES) {
    if (insights.length > 0 && axisCounts[axis] < threshold) {
      spots.push({
        id: generateId(),
        type: 'missing_coverage',
        axis,
        description: `הציר "${axis}" מכיל רק ${axisCounts[axis]} תובנות (ממוצע: ${avg.toFixed(1)}). כיסוי נמוך מ-20% מהממוצע.`,
        severity: axisCounts[axis] === 0 ? 'high' : 'medium',
        createdAt: now,
      });
    }
  }

  // 2. SOURCE GAP — sources with no cross-reference
  const referencedSourceIds = new Set(
    crossRefs.filter((r) => r.targetKind === 'source').map((r) => r.targetId)
  );
  for (const source of sources) {
    if (!referencedSourceIds.has(source.id)) {
      const primaryAxis = source.axes[0] ?? 'כללי';
      spots.push({
        id: generateId(),
        type: 'missing_coverage',
        axis: primaryAxis,
        description: `המקור "${source.title}" (${source.author}) לא מוצלב עם אף תובנה. הנושאים שלו לא טופלו: ${source.tags.slice(0, 3).join(', ')}.`,
        severity: 'medium',
        createdAt: now,
      });
    }
  }

  // 3. UNCHALLENGED ESTABLISHMENT — establishment sources without a 'contradicts' cross-ref
  const challengedIds = new Set(
    crossRefs
      .filter((r) => r.type === 'contradicts' && r.targetKind === 'source')
      .map((r) => r.targetId)
  );
  for (const source of sources) {
    if (source.stance === 'establishment' && !challengedIds.has(source.id)) {
      spots.push({
        id: generateId(),
        type: 'unchallenged_establishment',
        axis: source.axes[0] ?? 'מוסדי',
        description: `המקור הממסדי "${source.title}" (${source.author}) לא נסתר ולא קיבל אף תובנה נגדית. הממסד מתקבל ללא ביקורת.`,
        severity: 'high',
        createdAt: now,
      });
    }
  }

  // 4. OPEN QUESTIONS — insights with zachariasQuestion and no follow-up
  const insightIds = new Set(insights.map((i) => i.id));
  for (const insight of insights) {
    if (insight.zachariasQuestion && insight.zachariasQuestion.trim()) {
      const hasFollowUp = crossRefs.some(
        (ref) => ref.targetId === insight.id && ref.targetKind === 'insight'
      );
      if (!hasFollowUp) {
        spots.push({
          id: generateId(),
          type: 'open_question',
          axis: insight.axis,
          description: `שאלת זכריה ללא מענה: "${insight.zachariasQuestion}" (תובנה: ${insight.content.slice(0, 60)}...)`,
          severity: 'medium',
          createdAt: now,
        });
      }
    }
  }

  // 5. ROUND GAPS — topics in round N but absent in round N+1
  const maxRound = Math.max(...insights.map((i) => i.round), 0);
  if (maxRound >= 2) {
    const tagsByRound: Record<number, Set<string>> = {};
    for (const ins of insights) {
      if (!tagsByRound[ins.round]) tagsByRound[ins.round] = new Set();
      ins.tags.forEach((t) => tagsByRound[ins.round].add(t));
    }
    for (let r = 1; r < maxRound; r++) {
      const current = tagsByRound[r] ?? new Set();
      const next = tagsByRound[r + 1] ?? new Set();
      const dropped = [...current].filter((t) => !next.has(t));
      if (dropped.length >= 2) {
        // Find dominant axis for these tags
        const relatedInsights = insights.filter(
          (i) => i.round === r && i.tags.some((t) => dropped.includes(t))
        );
        const axisFreq: Partial<Record<Axis, number>> = {};
        relatedInsights.forEach((i) => {
          axisFreq[i.axis] = (axisFreq[i.axis] ?? 0) + 1;
        });
        const topAxis = (Object.entries(axisFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'כללי') as Axis;

        spots.push({
          id: generateId(),
          type: 'open_question',
          axis: topAxis,
          description: `נושאים שנעלמו בין סבב ${r} לסבב ${r + 1}: ${dropped.slice(0, 4).join(', ')}. אולי נזנחה חקירה פתוחה?`,
          severity: 'low',
          createdAt: now,
        });
      }
    }
  }

  // Remove duplicates by description similarity (simple dedup on first 60 chars)
  const seen = new Set<string>();
  return spots.filter((s) => {
    const key = s.description.slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
