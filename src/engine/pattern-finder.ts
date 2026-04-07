import type { Insight, CrossReference, Axis } from '../types/insight';
import type { Pattern } from '../types/analysis';
import { generateId } from '../utils/id';

export function findPatterns(insights: Insight[], crossRefs: CrossReference[]): Pattern[] {
  const patterns: Pattern[] = [];
  const now = new Date().toISOString();

  // 1. CROSS-AXIS CLUSTERS — tags that appear in 3+ different axes
  const tagAxesMap: Record<string, Set<Axis>> = {};
  for (const ins of insights) {
    for (const tag of ins.tags) {
      if (!tagAxesMap[tag]) tagAxesMap[tag] = new Set();
      tagAxesMap[tag].add(ins.axis);
    }
  }
  for (const [tag, axesSet] of Object.entries(tagAxesMap)) {
    if (axesSet.size >= 3) {
      const relatedIds = insights
        .filter((i) => i.tags.includes(tag))
        .map((i) => i.id);
      const rounds = new Set(insights.filter((i) => i.tags.includes(tag)).map((i) => i.round));
      patterns.push({
        id: generateId(),
        insightIds: relatedIds,
        crossRounds: rounds.size > 1,
        crossAxes: true,
        description: `התגית "${tag}" מופיעה ב-${axesSet.size} צירים: ${[...axesSet].join(', ')}. זהו דפוס רוחבי.`,
        implication: `הנושא "${tag}" הוא דגם מערכתי החוצה גבולות דיסציפלינריים — ייתכן שזו הנקודה המרכזית שדורשת ניסוח תיאורטי.`,
        createdAt: now,
      });
    }
  }

  // 2. EVOLUTION TRACKING — same tag across rounds (track change over time)
  const maxRound = Math.max(...insights.map((i) => i.round), 0);
  if (maxRound >= 2) {
    for (const [tag, axesSet] of Object.entries(tagAxesMap)) {
      const insightsByRound: Record<number, Insight[]> = {};
      for (const ins of insights) {
        if (!ins.tags.includes(tag)) continue;
        if (!insightsByRound[ins.round]) insightsByRound[ins.round] = [];
        insightsByRound[ins.round].push(ins);
      }
      const roundsWithTag = Object.keys(insightsByRound).map(Number).sort();
      if (roundsWithTag.length >= 3) {
        const allIds = roundsWithTag.flatMap((r) => insightsByRound[r].map((i) => i.id));
        patterns.push({
          id: generateId(),
          insightIds: allIds,
          crossRounds: true,
          crossAxes: axesSet.size > 1,
          description: `הנושא "${tag}" מתפתח על פני ${roundsWithTag.length} סבבים (${roundsWithTag.join(', ')}).`,
          implication: `הנושא "${tag}" הוא חוט עקבי במחקר — מומלץ לבחון כיצד ההבנה התפתחה ומה עדיין לא נפתר.`,
          createdAt: now,
        });
      }
    }
  }

  // 3. CONVERGENCE — insights from 3+ different axes all cross-referencing each other
  const insightAxisMap: Record<string, Axis> = {};
  insights.forEach((i) => (insightAxisMap[i.id] = i.axis));

  const connectionMap: Record<string, Set<string>> = {};
  for (const ref of crossRefs) {
    if (ref.targetKind !== 'insight') continue;
    if (!connectionMap[ref.insightId]) connectionMap[ref.insightId] = new Set();
    connectionMap[ref.insightId].add(ref.targetId);
    if (!connectionMap[ref.targetId]) connectionMap[ref.targetId] = new Set();
    connectionMap[ref.targetId].add(ref.insightId);
  }

  for (const [insightId, connectedIds] of Object.entries(connectionMap)) {
    const allIds = [insightId, ...connectedIds];
    const axes = new Set(allIds.map((id) => insightAxisMap[id]).filter(Boolean));
    if (axes.size >= 3 && connectedIds.size >= 2) {
      const alreadyCovered = patterns.some(
        (p) => allIds.every((id) => p.insightIds.includes(id))
      );
      if (!alreadyCovered) {
        const rounds = new Set(allIds.map((id) => insights.find((i) => i.id === id)?.round).filter(Boolean));
        patterns.push({
          id: generateId(),
          insightIds: allIds,
          crossRounds: rounds.size > 1,
          crossAxes: true,
          description: `תובנה "${insightId.slice(-4)}" מקושרת ל-${connectedIds.size} תובנות אחרות מ-${axes.size} צירים שונים.`,
          implication: `קיים מוקד התכנסות — תובנה זו עשויה להיות נקודת ציר מרכזית בטיעון.`,
          createdAt: now,
        });
      }
    }
  }

  // 4. HIDDEN CLUSTERS — tag co-occurrence: tags that always appear together
  const tagPairs: Record<string, number> = {};
  for (const ins of insights) {
    const tags = ins.tags;
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const key = [tags[i], tags[j]].sort().join('::');
        tagPairs[key] = (tagPairs[key] ?? 0) + 1;
      }
    }
  }
  for (const [pair, count] of Object.entries(tagPairs)) {
    if (count >= 3) {
      const [tagA, tagB] = pair.split('::');
      const relatedIds = insights
        .filter((i) => i.tags.includes(tagA) && i.tags.includes(tagB))
        .map((i) => i.id);
      const axes = new Set(relatedIds.map((id) => insightAxisMap[id]).filter(Boolean));
      const rounds = new Set(relatedIds.map((id) => insights.find((i) => i.id === id)?.round).filter(Boolean));
      patterns.push({
        id: generateId(),
        insightIds: relatedIds,
        crossRounds: rounds.size > 1,
        crossAxes: axes.size > 1,
        description: `"${tagA}" ו-"${tagB}" מופיעים יחד ב-${count} תובנות — אשכול נסתר.`,
        implication: `הצמד הזה עשוי לייצג רעיון שדורש הגדרה מפורשת. שקול לנסח תובנה-מטא שמחבר ביניהם.`,
        createdAt: now,
      });
    }
  }

  // Dedup patterns by description prefix
  const seen = new Set<string>();
  return patterns.filter((p) => {
    const key = p.description.slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
