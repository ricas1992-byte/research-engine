import type { Axis, CrossReference } from './insight';

export interface BlindSpot {
  id: string;
  type: 'missing_coverage' | 'unresolved_contradiction' | 'open_question' | 'unchallenged_establishment';
  axis: Axis;
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolvedBy?: string;
  createdAt: string;
}

export interface Pattern {
  id: string;
  insightIds: string[];
  crossRounds: boolean;
  crossAxes: boolean;
  description: string;
  implication: string;
  createdAt: string;
}

export interface ZachariaReport {
  id: string;
  round: number;
  generatedAt: string;
  newInsightsSummary: string;
  significantCrossRefs: CrossReference[];
  blindSpots: BlindSpot[];
  openQuestions: string[];
  suggestedTopics: string[];
}
