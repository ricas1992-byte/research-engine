export const RESEARCH_QUESTION = {
  text: 'אתה מהלך בפריפריה של העולם המופלא של המוסיקה ולכן יש לך זווית ראיה ייחודית. מה אתה רואה שהאדם מבפנים לא רואה?',
  attribution: 'ד"ר זכריה פלווין',
} as const;

export const CATEGORY_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#84cc16',
];

export type InvestigationStatus = 'גולמי' | 'בעבודה' | 'הושלמה';
export type InsightStatus = 'גולמי' | 'מעובד' | 'מוכן';
export type RawMaterialType = 'doc' | 'pdf' | 'audio' | 'image' | 'other';

export interface RawMaterial {
  id: string;
  title: string;
  url: string;
  source: 'gdrive';
  type: RawMaterialType;
  addedAt: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export interface SubQuestion {
  id: string;
  text: string;
  categoryId: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Investigation {
  id: string;
  subQuestionId: string;
  title: string;
  content: string;
  findings?: string;
  status: InvestigationStatus;
  rawMaterials?: RawMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string;
  investigationId: string;
  text: string;
  status: InsightStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FinalOutput {
  id: string;
  title: string;
  content: string;
  format: string;
  linkedInsights: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SourceExcerpt {
  id: string;
  quotedText: string;
  materialId: string;
  materialTitle: string;
  investigationId: string;
  investigationTitle: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
