export type Axis = 'כללי' | 'תיאורטי' | 'ביצועי' | 'פסיכולוגי' | 'מוסדי' | 'פדגוגי';
export type Status = 'גולמי' | 'מעובד' | 'מוכן';
export type SourceType = 'research' | 'book' | 'quote' | 'institutional' | 'personal';
export type Stance = 'establishment' | 'peripheral' | 'neutral';
export type CrossRefType = 'supports' | 'contradicts' | 'extends' | 'blind_spot' | 'pattern';

export interface Insight {
  id: string;
  content: string;
  axis: Axis;
  status: Status;
  round: number;
  tags: string[];
  relatedInsights: string[];
  sourceRefs: string[];
  createdAt: string;
  updatedAt: string;
  blindSpotFlag?: boolean;
  zachariasQuestion?: string;
}

export interface Source {
  id: string;
  type: SourceType;
  author: string;
  title: string;
  content: string;
  stance: Stance;
  axes: Axis[];
  tags: string[];
}

export interface CrossReference {
  id: string;
  type: CrossRefType;
  insightId: string;
  targetId: string;
  targetKind: 'insight' | 'source';
  explanation: string;
  zachpiracyQuestion: string;
  confidence: number;
  discoveredBy: 'manual' | 'engine';
  createdAt: string;
}
