import type { Insight, Source, CrossReference } from '../types/insight';
import { generateId } from '../utils/id';

function overlappingTags(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter((tag) => setB.has(tag)).length;
}

function axisWeight(a: Insight, b: Insight | Source): number {
  if ('axis' in b) {
    return a.axis === b.axis ? 1.5 : 1.0;
  }
  // Source has axes array
  return (b as Source).axes.includes(a.axis) ? 1.5 : 1.0;
}

export function findTextualMatches(
  insight: Insight,
  allInsights: Insight[],
  allSources: Source[]
): CrossReference[] {
  const refs: CrossReference[] = [];

  // Match against other insights
  for (const other of allInsights) {
    if (other.id === insight.id) continue;
    const overlap = overlappingTags(insight.tags, other.tags);
    if (overlap < 2) continue;

    const weight = axisWeight(insight, other);
    const rawScore = overlap * weight;
    const maxPossible = Math.max(insight.tags.length, other.tags.length) * 1.5;
    const confidence = Math.min(rawScore / maxPossible, 1);

    refs.push({
      id: generateId(),
      type: 'pattern',
      insightId: insight.id,
      targetId: other.id,
      targetKind: 'insight',
      explanation: `תגיות משותפות (${overlap}): ${insight.tags.filter((t) => other.tags.includes(t)).join(', ')}`,
      zachpiracyQuestion: 'מה מקשר בין שתי התובנות האלה ברמה עמוקה יותר מהתגיות?',
      confidence,
      discoveredBy: 'engine',
      createdAt: new Date().toISOString(),
    });
  }

  // Match against sources
  for (const source of allSources) {
    const overlap = overlappingTags(insight.tags, source.tags);
    if (overlap < 2) continue;

    const weight = source.axes.includes(insight.axis) ? 1.5 : 1.0;
    const rawScore = overlap * weight;
    const maxPossible = Math.max(insight.tags.length, source.tags.length) * 1.5;
    const confidence = Math.min(rawScore / maxPossible, 1);

    // Infer relationship type from stance
    let type: CrossReference['type'] = 'extends';
    if (source.stance === 'establishment') type = 'contradicts';
    else if (source.stance === 'peripheral') type = 'supports';

    refs.push({
      id: generateId(),
      type,
      insightId: insight.id,
      targetId: source.id,
      targetKind: 'source',
      explanation: `תגיות משותפות (${overlap}): ${insight.tags.filter((t) => source.tags.includes(t)).join(', ')}`,
      zachpiracyQuestion: 'מה מחזיק את הקשר הזה ביחד — ומה שובר אותו?',
      confidence,
      discoveredBy: 'engine',
      createdAt: new Date().toISOString(),
    });
  }

  return refs;
}
