import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Category, SubQuestion, Investigation, Insight,
  FinalOutput, RawMaterial, SourceExcerpt,
} from '../types/index';

interface StoreState {
  categories: Category[];
  subQuestions: SubQuestion[];
  investigations: Investigation[];
  insights: Insight[];
  finalOutputs: FinalOutput[];
  sourceExcerpts: SourceExcerpt[];

  // Category CRUD
  addCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Category;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>) => void;
  deleteCategory: (id: string) => void;

  // SubQuestion CRUD + ordering
  addSubQuestion: (data: Omit<SubQuestion, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => SubQuestion;
  updateSubQuestion: (id: string, updates: Partial<Omit<SubQuestion, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteSubQuestion: (id: string) => void;
  moveSubQuestionUp: (id: string) => void;
  moveSubQuestionDown: (id: string) => void;

  // Investigation CRUD
  addInvestigation: (data: Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>) => Investigation;
  updateInvestigation: (id: string, updates: Partial<Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteInvestigation: (id: string) => void;

  // Insight CRUD
  addInsight: (data: Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>) => Insight;
  updateInsight: (id: string, updates: Partial<Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteInsight: (id: string) => void;

  // FinalOutput CRUD
  addFinalOutput: (data: Omit<FinalOutput, 'id' | 'createdAt' | 'updatedAt'>) => FinalOutput;
  updateFinalOutput: (id: string, updates: Partial<Omit<FinalOutput, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteFinalOutput: (id: string) => void;

  // RawMaterial CRUD (nested inside Investigation)
  addRawMaterial: (investigationId: string, data: Omit<RawMaterial, 'id' | 'addedAt'>) => void;
  deleteRawMaterial: (investigationId: string, materialId: string) => void;
  updateRawMaterial: (investigationId: string, materialId: string, updates: Partial<Omit<RawMaterial, 'id' | 'addedAt'>>) => void;

  // SourceExcerpt CRUD
  addSourceExcerpt: (data: Omit<SourceExcerpt, 'id' | 'createdAt' | 'updatedAt'>) => SourceExcerpt;
  updateSourceExcerpt: (id: string, updates: Partial<Omit<SourceExcerpt, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteSourceExcerpt: (id: string) => void;

  // Export/Import
  exportToJSON: () => string;
  importFromJSON: (jsonStr: string) => boolean;
}

const now = () => new Date().toISOString();

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      categories: [],
      subQuestions: [],
      investigations: [],
      insights: [],
      finalOutputs: [],
      sourceExcerpts: [],

      // ─── Categories ──────────────────────────────────────────
      addCategory: (data) => {
        const item: Category = { ...data, id: uuidv4(), createdAt: now() };
        set((s) => ({ categories: [item, ...s.categories] }));
        return item;
      },
      updateCategory: (id, updates) => {
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },
      deleteCategory: (id) => {
        const { subQuestions, deleteSubQuestion } = get();
        subQuestions.filter((sq) => sq.categoryId === id).forEach((sq) => deleteSubQuestion(sq.id));
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
      },

      // ─── SubQuestions ─────────────────────────────────────────
      addSubQuestion: (data) => {
        const { subQuestions } = get();
        const categoryMax = subQuestions
          .filter((sq) => sq.categoryId === data.categoryId)
          .reduce((max, sq) => Math.max(max, sq.order ?? 0), -1);
        const item: SubQuestion = {
          ...data,
          id: uuidv4(),
          order: categoryMax + 1,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ subQuestions: [...s.subQuestions, item] }));
        return item;
      },
      updateSubQuestion: (id, updates) => {
        set((s) => ({
          subQuestions: s.subQuestions.map((sq) =>
            sq.id === id ? { ...sq, ...updates, updatedAt: now() } : sq
          ),
        }));
      },
      deleteSubQuestion: (id) => {
        const { investigations, deleteInvestigation } = get();
        investigations.filter((inv) => inv.subQuestionId === id).forEach((inv) => deleteInvestigation(inv.id));
        set((s) => ({ subQuestions: s.subQuestions.filter((sq) => sq.id !== id) }));
      },
      moveSubQuestionUp: (id) => {
        set((s) => {
          const sq = s.subQuestions.find((q) => q.id === id);
          if (!sq) return {};
          const sorted = [...s.subQuestions]
            .filter((q) => q.categoryId === sq.categoryId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const idx = sorted.findIndex((q) => q.id === id);
          if (idx <= 0) return {};
          // swap
          const updated = sorted.map((q, i) => {
            if (i === idx - 1) return { ...q, order: sorted[idx].order ?? idx, updatedAt: now() };
            if (i === idx)     return { ...q, order: sorted[idx - 1].order ?? (idx - 1), updatedAt: now() };
            return q;
          });
          const orderMap = new Map(updated.map((q) => [q.id, q.order]));
          return {
            subQuestions: s.subQuestions.map((q) =>
              orderMap.has(q.id) ? { ...q, order: orderMap.get(q.id)!, updatedAt: now() } : q
            ),
          };
        });
      },
      moveSubQuestionDown: (id) => {
        set((s) => {
          const sq = s.subQuestions.find((q) => q.id === id);
          if (!sq) return {};
          const sorted = [...s.subQuestions]
            .filter((q) => q.categoryId === sq.categoryId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const idx = sorted.findIndex((q) => q.id === id);
          if (idx < 0 || idx >= sorted.length - 1) return {};
          const updated = sorted.map((q, i) => {
            if (i === idx)     return { ...q, order: sorted[idx + 1].order ?? (idx + 1), updatedAt: now() };
            if (i === idx + 1) return { ...q, order: sorted[idx].order ?? idx, updatedAt: now() };
            return q;
          });
          const orderMap = new Map(updated.map((q) => [q.id, q.order]));
          return {
            subQuestions: s.subQuestions.map((q) =>
              orderMap.has(q.id) ? { ...q, order: orderMap.get(q.id)!, updatedAt: now() } : q
            ),
          };
        });
      },

      // ─── Investigations ───────────────────────────────────────
      addInvestigation: (data) => {
        const item: Investigation = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ investigations: [item, ...s.investigations] }));
        return item;
      },
      updateInvestigation: (id, updates) => {
        set((s) => ({
          investigations: s.investigations.map((inv) =>
            inv.id === id ? { ...inv, ...updates, updatedAt: now() } : inv
          ),
        }));
      },
      deleteInvestigation: (id) => {
        const { insights, deleteInsight } = get();
        insights.filter((ins) => ins.investigationId === id).forEach((ins) => deleteInsight(ins.id));
        set((s) => ({
          investigations: s.investigations.filter((inv) => inv.id !== id),
          sourceExcerpts: s.sourceExcerpts.filter((e) => e.investigationId !== id),
        }));
      },

      // ─── Insights ─────────────────────────────────────────────
      addInsight: (data) => {
        const item: Insight = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ insights: [item, ...s.insights] }));
        return item;
      },
      updateInsight: (id, updates) => {
        set((s) => ({
          insights: s.insights.map((ins) =>
            ins.id === id ? { ...ins, ...updates, updatedAt: now() } : ins
          ),
        }));
      },
      deleteInsight: (id) => {
        set((s) => ({
          insights: s.insights.filter((ins) => ins.id !== id),
          finalOutputs: s.finalOutputs.map((fo) => ({
            ...fo,
            linkedInsights: fo.linkedInsights.filter((lid) => lid !== id),
          })),
        }));
      },

      // ─── FinalOutputs ─────────────────────────────────────────
      addFinalOutput: (data) => {
        const item: FinalOutput = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ finalOutputs: [item, ...s.finalOutputs] }));
        return item;
      },
      updateFinalOutput: (id, updates) => {
        set((s) => ({
          finalOutputs: s.finalOutputs.map((fo) =>
            fo.id === id ? { ...fo, ...updates, updatedAt: now() } : fo
          ),
        }));
      },
      deleteFinalOutput: (id) => {
        set((s) => ({ finalOutputs: s.finalOutputs.filter((fo) => fo.id !== id) }));
      },

      // ─── RawMaterials ─────────────────────────────────────────
      addRawMaterial: (investigationId, data) => {
        const material: RawMaterial = { ...data, id: uuidv4(), addedAt: now() };
        set((s) => ({
          investigations: s.investigations.map((inv) =>
            inv.id === investigationId
              ? { ...inv, rawMaterials: [...(inv.rawMaterials ?? []), material] }
              : inv
          ),
        }));
      },
      deleteRawMaterial: (investigationId, materialId) => {
        set((s) => ({
          investigations: s.investigations.map((inv) =>
            inv.id === investigationId
              ? { ...inv, rawMaterials: (inv.rawMaterials ?? []).filter((m) => m.id !== materialId) }
              : inv
          ),
          sourceExcerpts: s.sourceExcerpts.filter((e) => e.materialId !== materialId),
        }));
      },
      updateRawMaterial: (investigationId, materialId, updates) => {
        set((s) => ({
          investigations: s.investigations.map((inv) =>
            inv.id === investigationId
              ? {
                  ...inv,
                  rawMaterials: (inv.rawMaterials ?? []).map((m) =>
                    m.id === materialId ? { ...m, ...updates } : m
                  ),
                }
              : inv
          ),
        }));
      },

      // ─── SourceExcerpts ───────────────────────────────────────
      addSourceExcerpt: (data) => {
        const item: SourceExcerpt = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ sourceExcerpts: [item, ...s.sourceExcerpts] }));
        return item;
      },
      updateSourceExcerpt: (id, updates) => {
        set((s) => ({
          sourceExcerpts: s.sourceExcerpts.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: now() } : e
          ),
        }));
      },
      deleteSourceExcerpt: (id) => {
        set((s) => ({ sourceExcerpts: s.sourceExcerpts.filter((e) => e.id !== id) }));
      },

      // ─── Export / Import ─────────────────────────────────────
      exportToJSON: () => {
        const { categories, subQuestions, investigations, insights, finalOutputs, sourceExcerpts } = get();
        return JSON.stringify(
          { categories, subQuestions, investigations, insights, finalOutputs, sourceExcerpts },
          null,
          2
        );
      },
      importFromJSON: (jsonStr) => {
        try {
          const data = JSON.parse(jsonStr);
          if (!data.categories) return false;
          // Migrate: ensure all subQuestions have an order field
          const migratedSQs: SubQuestion[] = (data.subQuestions ?? []).map(
            (sq: SubQuestion, idx: number) => ({ ...sq, order: sq.order ?? idx })
          );
          set({
            categories: data.categories ?? [],
            subQuestions: migratedSQs,
            investigations: data.investigations ?? [],
            insights: data.insights ?? [],
            finalOutputs: data.finalOutputs ?? [],
            sourceExcerpts: data.sourceExcerpts ?? [],
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'musical-thinking-v3',
      partialize: (state) => ({
        categories: state.categories,
        subQuestions: state.subQuestions,
        investigations: state.investigations,
        insights: state.insights,
        finalOutputs: state.finalOutputs,
        sourceExcerpts: state.sourceExcerpts,
      }),
      // Migrate existing data: add order to subQuestions that don't have it
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const needsMigration = state.subQuestions.some((sq) => sq.order === undefined);
        if (needsMigration) {
          const categoryGroups = new Map<string, SubQuestion[]>();
          for (const sq of state.subQuestions) {
            if (!categoryGroups.has(sq.categoryId)) categoryGroups.set(sq.categoryId, []);
            categoryGroups.get(sq.categoryId)!.push(sq);
          }
          const migrated: SubQuestion[] = [];
          for (const [, sqs] of categoryGroups) {
            sqs.forEach((sq, i) => migrated.push({ ...sq, order: sq.order ?? i }));
          }
          state.subQuestions = migrated;
        }
      },
    }
  )
);
