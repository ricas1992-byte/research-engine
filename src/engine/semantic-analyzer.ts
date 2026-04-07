import type { Insight, Source, CrossReference, CrossRefType } from '../types/insight';
import { callClaude } from '../utils/claude-api';
import { buildCrossRefPrompt } from './prompts';
import { generateId } from '../utils/id';

interface ClaudeRefResult {
  type: CrossRefType;
  explanation: string;
  zachpiracyQuestion: string;
  confidence: number;
}

async function analyzeOnePair(
  insight: Insight,
  target: Insight | Source,
  targetKind: 'insight' | 'source'
): Promise<CrossReference | null> {
  const prompt = buildCrossRefPrompt(insight, target, targetKind);

  try {
    const raw = await callClaude(prompt);
    // Strip possible markdown code fences
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result: ClaudeRefResult = JSON.parse(cleaned);

    return {
      id: generateId(),
      type: result.type,
      insightId: insight.id,
      targetId: target.id,
      targetKind,
      explanation: result.explanation,
      zachpiracyQuestion: result.zachpiracyQuestion,
      confidence: Math.max(0, Math.min(1, result.confidence)),
      discoveredBy: 'engine',
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function analyzeInsightWithSources(
  insight: Insight,
  allInsights: Insight[],
  allSources: Source[]
): Promise<CrossReference[]> {
  const refs: CrossReference[] = [];

  // Candidate pairs: different-axis insights that share ≥1 tag
  const candidateInsights = allInsights.filter(
    (other) =>
      other.id !== insight.id &&
      other.axis !== insight.axis &&
      other.tags.some((t) => insight.tags.includes(t))
  );

  // All sources that share ≥1 tag
  const candidateSources = allSources.filter((src) =>
    src.tags.some((t) => insight.tags.includes(t))
  );

  const pairs: Array<{ target: Insight | Source; kind: 'insight' | 'source' }> = [
    ...candidateInsights.map((t) => ({ target: t as Insight | Source, kind: 'insight' as const })),
    ...candidateSources.map((t) => ({ target: t as Insight | Source, kind: 'source' as const })),
  ];

  // Process in batches of 5 with 1-second delay
  const batchSize = 5;
  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(({ target, kind }) => analyzeOnePair(insight, target, kind))
    );
    results.forEach((r) => r && refs.push(r));

    if (i + batchSize < pairs.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return refs;
}
