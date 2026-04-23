import { create } from 'zustand';
import type {
  Category, SubCategory, SubQuestion, Investigation, Insight,
  FinalOutput, RawMaterial, SourceExcerpt,
} from '../types/index';
import {
  fetchAllCategories, createCategory, updateCategory as apiUpdateCategory, deleteCategory as apiDeleteCategory,
} from '../lib/api/categories';
import {
  fetchAllSubCategories, createSubCategory, updateSubCategory as apiUpdateSubCategory, deleteSubCategory as apiDeleteSubCategory,
} from '../lib/api/subCategories';
import {
  fetchAllSubQuestions, createSubQuestion, updateSubQuestion as apiUpdateSubQuestion, deleteSubQuestion as apiDeleteSubQuestion,
} from '../lib/api/subQuestions';
import {
  fetchAllInvestigations, createInvestigation, updateInvestigation as apiUpdateInvestigation, deleteInvestigation as apiDeleteInvestigation,
} from '../lib/api/investigations';
import {
  fetchAllInsights, createInsight, updateInsight as apiUpdateInsight, deleteInsight as apiDeleteInsight,
} from '../lib/api/insights';
import {
  fetchAllFinalOutputs, createFinalOutput, updateFinalOutput as apiUpdateFinalOutput, deleteFinalOutput as apiDeleteFinalOutput,
} from '../lib/api/finalOutputs';
import {
  fetchAllSourceExcerpts, createSourceExcerpt, updateSourceExcerpt as apiUpdateSourceExcerpt, deleteSourceExcerpt as apiDeleteSourceExcerpt,
} from '../lib/api/sourceExcerpts';

interface StoreState {
  categories: Category[];
  subCategories: SubCategory[];
  subQuestions: SubQuestion[];
  investigations: Investigation[];
  insights: Insight[];
  finalOutputs: FinalOutput[];
  sourceExcerpts: SourceExcerpt[];

  isLoading: boolean;
  syncError: string | null;

  // Hydration
  hydrateFromSupabase: () => Promise<void>;
  clearAll: () => void;

  // Category CRUD
  addCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // SubCategory CRUD + ordering
  addSubCategory: (categoryId: string, data: Omit<SubCategory, 'id' | 'categoryId' | 'order' | 'createdAt' | 'updatedAt'>) => Promise<SubCategory>;
  updateSubCategory: (id: string, updates: Partial<Omit<SubCategory, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSubCategory: (id: string) => Promise<void>;
  reorderSubCategories: (categoryId: string, orderedIds: string[]) => Promise<void>;

  // SubCategory selectors (sync — read from local state)
  getSubCategoriesByCategory: (categoryId: string) => SubCategory[];
  getSubQuestionsBySubCategory: (subCategoryId: string) => SubQuestion[];
  getDirectSubQuestionsByCategory: (categoryId: string) => SubQuestion[];

  // SubQuestion CRUD + ordering
  addSubQuestion: (data: Omit<SubQuestion, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => Promise<SubQuestion>;
  updateSubQuestion: (id: string, updates: Partial<Omit<SubQuestion, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSubQuestion: (id: string) => Promise<void>;
  moveSubQuestionUp: (id: string) => Promise<void>;
  moveSubQuestionDown: (id: string) => Promise<void>;

  // Investigation CRUD
  addInvestigation: (data: Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Investigation>;
  updateInvestigation: (id: string, updates: Partial<Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteInvestigation: (id: string) => Promise<void>;

  // Insight CRUD
  addInsight: (data: Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Insight>;
  updateInsight: (id: string, updates: Partial<Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteInsight: (id: string) => Promise<void>;

  // FinalOutput CRUD
  addFinalOutput: (data: Omit<FinalOutput, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FinalOutput>;
  updateFinalOutput: (id: string, updates: Partial<Omit<FinalOutput, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteFinalOutput: (id: string) => Promise<void>;

  // RawMaterial CRUD (nested inside Investigation)
  addRawMaterial: (investigationId: string, data: Omit<RawMaterial, 'id' | 'addedAt'>) => Promise<void>;
  deleteRawMaterial: (investigationId: string, materialId: string) => Promise<void>;
  updateRawMaterial: (investigationId: string, materialId: string, updates: Partial<Omit<RawMaterial, 'id' | 'addedAt'>>) => Promise<void>;

  // SourceExcerpt CRUD
  addSourceExcerpt: (data: Omit<SourceExcerpt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SourceExcerpt>;
  updateSourceExcerpt: (id: string, updates: Partial<Omit<SourceExcerpt, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSourceExcerpt: (id: string) => Promise<void>;

  // Export/Import (in-memory, for JSON backup)
  exportToJSON: () => string;
  importFromJSON: (jsonStr: string) => boolean;

  // Error/loading helpers
  clearSyncError: () => void;
}

const now = () => new Date().toISOString();
const genId = () => crypto.randomUUID();

export const useStore = create<StoreState>()((set, get) => ({
  categories: [],
  subCategories: [],
  subQuestions: [],
  investigations: [],
  insights: [],
  finalOutputs: [],
  sourceExcerpts: [],
  isLoading: false,
  syncError: null,

  // ─── Hydration ────────────────────────────────────────────
  hydrateFromSupabase: async () => {
    set({ isLoading: true, syncError: null });
    try {
      const [categories, subCategories, subQuestions, investigations, insights, finalOutputs, sourceExcerpts] =
        await Promise.all([
          fetchAllCategories(),
          fetchAllSubCategories(),
          fetchAllSubQuestions(),
          fetchAllInvestigations(),
          fetchAllInsights(),
          fetchAllFinalOutputs(),
          fetchAllSourceExcerpts(),
        ]);
      set({ categories, subCategories, subQuestions, investigations, insights, finalOutputs, sourceExcerpts, isLoading: false });
    } catch (err) {
      set({ isLoading: false, syncError: String(err) });
    }
  },

  clearAll: () => {
    set({ categories: [], subCategories: [], subQuestions: [], investigations: [], insights: [], finalOutputs: [], sourceExcerpts: [] });
  },

  // ─── Categories ───────────────────────────────────────────
  addCategory: async (data) => {
    const optimistic: Category = { ...data, id: genId(), createdAt: now() };
    set((s) => ({ categories: [optimistic, ...s.categories] }));
    try {
      const saved = await createCategory(data);
      set((s) => ({ categories: s.categories.map((c) => (c.id === optimistic.id ? saved : c)) }));
      return saved;
    } catch (err) {
      set((s) => ({ categories: s.categories.filter((c) => c.id !== optimistic.id), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  updateCategory: async (id, updates) => {
    const prev = get().categories.find((c) => c.id === id);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
    try {
      const saved = await apiUpdateCategory(id, updates);
      set((s) => ({ categories: s.categories.map((c) => (c.id === id ? saved : c)) }));
    } catch (err) {
      if (prev) set((s) => ({ categories: s.categories.map((c) => (c.id === id ? prev : c)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  deleteCategory: async (id) => {
    const prevCategories = get().categories;
    const prevSubCategories = get().subCategories;
    const prevSubQuestions = get().subQuestions;
    // Optimistic: remove category, its sub-categories, and its sub-questions
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      subCategories: s.subCategories.filter((sc) => sc.categoryId !== id),
      subQuestions: s.subQuestions.filter((sq) => sq.categoryId !== id),
    }));
    try {
      await apiDeleteCategory(id); // cascade handles sub-categories, sub-questions, investigations, insights
    } catch (err) {
      set({ categories: prevCategories, subCategories: prevSubCategories, subQuestions: prevSubQuestions, syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },

  // ─── SubCategories ────────────────────────────────────────
  addSubCategory: async (categoryId, data) => {
    const { subCategories } = get();
    const maxOrder = subCategories
      .filter((sc) => sc.categoryId === categoryId)
      .reduce((max, sc) => Math.max(max, sc.order ?? 0), -1);
    const optimistic: SubCategory = { ...data, id: genId(), categoryId, order: maxOrder + 1, createdAt: now(), updatedAt: now() };
    set((s) => ({ subCategories: [...s.subCategories, optimistic] }));
    try {
      const saved = await createSubCategory({ categoryId, ...data });
      // Patch order to match optimistic
      const patched = await apiUpdateSubCategory(saved.id, { order: maxOrder + 1 });
      set((s) => ({ subCategories: s.subCategories.map((sc) => (sc.id === optimistic.id ? patched : sc)) }));
      return patched;
    } catch (err) {
      set((s) => ({ subCategories: s.subCategories.filter((sc) => sc.id !== optimistic.id), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  updateSubCategory: async (id, updates) => {
    const prev = get().subCategories.find((sc) => sc.id === id);
    set((s) => ({ subCategories: s.subCategories.map((sc) => (sc.id === id ? { ...sc, ...updates, updatedAt: now() } : sc)) }));
    try {
      const saved = await apiUpdateSubCategory(id, updates);
      set((s) => ({ subCategories: s.subCategories.map((sc) => (sc.id === id ? saved : sc)) }));
    } catch (err) {
      if (prev) set((s) => ({ subCategories: s.subCategories.map((sc) => (sc.id === id ? prev : sc)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  deleteSubCategory: async (id) => {
    const prev = get().subCategories;
    const prevSQ = get().subQuestions;
    set((s) => ({
      subCategories: s.subCategories.filter((sc) => sc.id !== id),
      subQuestions: s.subQuestions.map((sq) =>
        sq.subCategoryId === id ? { ...sq, subCategoryId: null, updatedAt: now() } : sq
      ),
    }));
    try {
      await apiDeleteSubCategory(id);
      // Server cascade sets sub_category_id → null on sub_questions, so local state already matches
    } catch (err) {
      set({ subCategories: prev, subQuestions: prevSQ, syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },
  reorderSubCategories: async (categoryId, orderedIds) => {
    const prev = get().subCategories;
    set((s) => ({
      subCategories: s.subCategories.map((sc) => {
        if (sc.categoryId !== categoryId) return sc;
        const idx = orderedIds.indexOf(sc.id);
        return idx === -1 ? sc : { ...sc, order: idx, updatedAt: now() };
      }),
    }));
    try {
      await Promise.all(
        orderedIds.map((id, idx) => apiUpdateSubCategory(id, { order: idx }))
      );
    } catch (err) {
      set({ subCategories: prev, syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },

  // ─── SubCategory selectors ────────────────────────────────
  getSubCategoriesByCategory: (categoryId) =>
    get().subCategories.filter((sc) => sc.categoryId === categoryId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),

  getSubQuestionsBySubCategory: (subCategoryId) =>
    get().subQuestions.filter((sq) => sq.subCategoryId === subCategoryId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),

  getDirectSubQuestionsByCategory: (categoryId) =>
    get().subQuestions.filter((sq) => sq.categoryId === categoryId && sq.subCategoryId == null).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),

  // ─── SubQuestions ──────────────────────────────────────────
  addSubQuestion: async (data) => {
    const { subQuestions } = get();
    const groupMax = subQuestions
      .filter((sq) => sq.categoryId === data.categoryId && (sq.subCategoryId ?? null) === (data.subCategoryId ?? null))
      .reduce((max, sq) => Math.max(max, sq.order ?? 0), -1);
    const optimistic: SubQuestion = { ...data, subCategoryId: data.subCategoryId ?? null, id: genId(), order: groupMax + 1, createdAt: now(), updatedAt: now() };
    set((s) => ({ subQuestions: [...s.subQuestions, optimistic] }));
    try {
      const saved = await createSubQuestion(data);
      const patched = await apiUpdateSubQuestion(saved.id, { order: groupMax + 1 });
      set((s) => ({ subQuestions: s.subQuestions.map((sq) => (sq.id === optimistic.id ? patched : sq)) }));
      return patched;
    } catch (err) {
      set((s) => ({ subQuestions: s.subQuestions.filter((sq) => sq.id !== optimistic.id), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  updateSubQuestion: async (id, updates) => {
    const prev = get().subQuestions.find((sq) => sq.id === id);
    set((s) => ({ subQuestions: s.subQuestions.map((sq) => (sq.id === id ? { ...sq, ...updates, updatedAt: now() } : sq)) }));
    try {
      const saved = await apiUpdateSubQuestion(id, updates);
      set((s) => ({ subQuestions: s.subQuestions.map((sq) => (sq.id === id ? saved : sq)) }));
    } catch (err) {
      if (prev) set((s) => ({ subQuestions: s.subQuestions.map((sq) => (sq.id === id ? prev : sq)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  deleteSubQuestion: async (id) => {
    const prevSQ = get().subQuestions;
    const prevInv = get().investigations;
    const prevIns = get().insights;
    set((s) => ({
      subQuestions: s.subQuestions.filter((sq) => sq.id !== id),
      investigations: s.investigations.filter((inv) => inv.subQuestionId !== id),
      insights: s.insights.filter((ins) => !prevInv.filter((inv) => inv.subQuestionId === id).map((inv) => inv.id).includes(ins.investigationId)),
    }));
    try {
      await apiDeleteSubQuestion(id);
    } catch (err) {
      set({ subQuestions: prevSQ, investigations: prevInv, insights: prevIns, syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },
  moveSubQuestionUp: async (id) => {
    const sq = get().subQuestions.find((q) => q.id === id);
    if (!sq) return;
    const sorted = [...get().subQuestions]
      .filter((q) => q.categoryId === sq.categoryId && (q.subCategoryId ?? null) === (sq.subCategoryId ?? null))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((q) => q.id === id);
    if (idx <= 0) return;
    const newOrder = sorted[idx - 1].order ?? (idx - 1);
    const prevOrder = sorted[idx].order ?? idx;
    try {
      await Promise.all([
        apiUpdateSubQuestion(sorted[idx].id, { order: newOrder }),
        apiUpdateSubQuestion(sorted[idx - 1].id, { order: prevOrder }),
      ]);
      set((s) => ({
        subQuestions: s.subQuestions.map((q) => {
          if (q.id === sorted[idx].id) return { ...q, order: newOrder, updatedAt: now() };
          if (q.id === sorted[idx - 1].id) return { ...q, order: prevOrder, updatedAt: now() };
          return q;
        }),
      }));
    } catch (err) {
      set({ syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },
  moveSubQuestionDown: async (id) => {
    const sq = get().subQuestions.find((q) => q.id === id);
    if (!sq) return;
    const sorted = [...get().subQuestions]
      .filter((q) => q.categoryId === sq.categoryId && (q.subCategoryId ?? null) === (sq.subCategoryId ?? null))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((q) => q.id === id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const newOrder = sorted[idx + 1].order ?? (idx + 1);
    const prevOrder = sorted[idx].order ?? idx;
    try {
      await Promise.all([
        apiUpdateSubQuestion(sorted[idx].id, { order: newOrder }),
        apiUpdateSubQuestion(sorted[idx + 1].id, { order: prevOrder }),
      ]);
      set((s) => ({
        subQuestions: s.subQuestions.map((q) => {
          if (q.id === sorted[idx].id) return { ...q, order: newOrder, updatedAt: now() };
          if (q.id === sorted[idx + 1].id) return { ...q, order: prevOrder, updatedAt: now() };
          return q;
        }),
      }));
    } catch (err) {
      set({ syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },

  // ─── Investigations ────────────────────────────────────────
  addInvestigation: async (data) => {
    const optimistic: Investigation = { ...data, id: genId(), createdAt: now(), updatedAt: now() };
    set((s) => ({ investigations: [optimistic, ...s.investigations] }));
    try {
      const saved = await createInvestigation(data);
      set((s) => ({ investigations: s.investigations.map((inv) => (inv.id === optimistic.id ? saved : inv)) }));
      return saved;
    } catch (err) {
      set((s) => ({ investigations: s.investigations.filter((inv) => inv.id !== optimistic.id), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  updateInvestigation: async (id, updates) => {
    const prev = get().investigations.find((inv) => inv.id === id);
    set((s) => ({ investigations: s.investigations.map((inv) => (inv.id === id ? { ...inv, ...updates, updatedAt: now() } : inv)) }));
    try {
      const saved = await apiUpdateInvestigation(id, updates);
      set((s) => ({ investigations: s.investigations.map((inv) => (inv.id === id ? saved : inv)) }));
    } catch (err) {
      if (prev) set((s) => ({ investigations: s.investigations.map((inv) => (inv.id === id ? prev : inv)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  deleteInvestigation: async (id) => {
    const prevInv = get().investigations;
    const prevIns = get().insights;
    const prevSE = get().sourceExcerpts;
    set((s) => ({
      investigations: s.investigations.filter((inv) => inv.id !== id),
      insights: s.insights.filter((ins) => ins.investigationId !== id),
      sourceExcerpts: s.sourceExcerpts.filter((e) => e.investigationId !== id),
    }));
    try {
      await apiDeleteInvestigation(id);
    } catch (err) {
      set({ investigations: prevInv, insights: prevIns, sourceExcerpts: prevSE, syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },

  // ─── Insights ──────────────────────────────────────────────
  addInsight: async (data) => {
    const optimistic: Insight = { ...data, id: genId(), createdAt: now(), updatedAt: now() };
    set((s) => ({ insights: [optimistic, ...s.insights] }));
    try {
      const saved = await createInsight(data);
      set((s) => ({ insights: s.insights.map((ins) => (ins.id === optimistic.id ? saved : ins)) }));
      return saved;
    } catch (err) {
      set((s) => ({ insights: s.insights.filter((ins) => ins.id !== optimistic.id), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  updateInsight: async (id, updates) => {
    const prev = get().insights.find((ins) => ins.id === id);
    set((s) => ({ insights: s.insights.map((ins) => (ins.id === id ? { ...ins, ...updates, updatedAt: now() } : ins)) }));
    try {
      const saved = await apiUpdateInsight(id, updates);
      set((s) => ({ insights: s.insights.map((ins) => (ins.id === id ? saved : ins)) }));
    } catch (err) {
      if (prev) set((s) => ({ insights: s.insights.map((ins) => (ins.id === id ? prev : ins)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  deleteInsight: async (id) => {
    const prev = get().insights;
    const prevFO = get().finalOutputs;
    set((s) => ({
      insights: s.insights.filter((ins) => ins.id !== id),
      finalOutputs: s.finalOutputs.map((fo) => ({ ...fo, linkedInsights: fo.linkedInsights.filter((lid) => lid !== id) })),
    }));
    try {
      await apiDeleteInsight(id);
    } catch (err) {
      set({ insights: prev, finalOutputs: prevFO, syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },

  // ─── FinalOutputs ──────────────────────────────────────────
  addFinalOutput: async (data) => {
    const optimistic: FinalOutput = { ...data, id: genId(), createdAt: now(), updatedAt: now() };
    set((s) => ({ finalOutputs: [optimistic, ...s.finalOutputs] }));
    try {
      const saved = await createFinalOutput(data);
      set((s) => ({ finalOutputs: s.finalOutputs.map((fo) => (fo.id === optimistic.id ? saved : fo)) }));
      return saved;
    } catch (err) {
      set((s) => ({ finalOutputs: s.finalOutputs.filter((fo) => fo.id !== optimistic.id), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  updateFinalOutput: async (id, updates) => {
    const prev = get().finalOutputs.find((fo) => fo.id === id);
    set((s) => ({ finalOutputs: s.finalOutputs.map((fo) => (fo.id === id ? { ...fo, ...updates, updatedAt: now() } : fo)) }));
    try {
      const saved = await apiUpdateFinalOutput(id, updates);
      set((s) => ({ finalOutputs: s.finalOutputs.map((fo) => (fo.id === id ? saved : fo)) }));
    } catch (err) {
      if (prev) set((s) => ({ finalOutputs: s.finalOutputs.map((fo) => (fo.id === id ? prev : fo)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  deleteFinalOutput: async (id) => {
    const prev = get().finalOutputs;
    set((s) => ({ finalOutputs: s.finalOutputs.filter((fo) => fo.id !== id) }));
    try {
      await apiDeleteFinalOutput(id);
    } catch (err) {
      set({ finalOutputs: prev, syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },

  // ─── RawMaterials (nested in Investigation) ────────────────
  addRawMaterial: async (investigationId, data) => {
    const material: RawMaterial = { ...data, id: genId(), addedAt: now() };
    const prev = get().investigations.find((inv) => inv.id === investigationId);
    const updatedMaterials = [...(prev?.rawMaterials ?? []), material];
    set((s) => ({
      investigations: s.investigations.map((inv) =>
        inv.id === investigationId ? { ...inv, rawMaterials: updatedMaterials } : inv
      ),
    }));
    try {
      await apiUpdateInvestigation(investigationId, { rawMaterials: updatedMaterials });
    } catch (err) {
      if (prev) set((s) => ({ investigations: s.investigations.map((inv) => (inv.id === investigationId ? prev : inv)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  deleteRawMaterial: async (investigationId, materialId) => {
    const prev = get().investigations.find((inv) => inv.id === investigationId);
    const updatedMaterials = (prev?.rawMaterials ?? []).filter((m) => m.id !== materialId);
    set((s) => ({
      investigations: s.investigations.map((inv) =>
        inv.id === investigationId ? { ...inv, rawMaterials: updatedMaterials } : inv
      ),
      sourceExcerpts: s.sourceExcerpts.filter((e) => e.materialId !== materialId),
    }));
    try {
      await apiUpdateInvestigation(investigationId, { rawMaterials: updatedMaterials });
    } catch (err) {
      if (prev) set((s) => ({ investigations: s.investigations.map((inv) => (inv.id === investigationId ? prev : inv)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  updateRawMaterial: async (investigationId, materialId, updates) => {
    const prev = get().investigations.find((inv) => inv.id === investigationId);
    const updatedMaterials = (prev?.rawMaterials ?? []).map((m) =>
      m.id === materialId ? { ...m, ...updates } : m
    );
    set((s) => ({
      investigations: s.investigations.map((inv) =>
        inv.id === investigationId ? { ...inv, rawMaterials: updatedMaterials } : inv
      ),
    }));
    try {
      await apiUpdateInvestigation(investigationId, { rawMaterials: updatedMaterials });
    } catch (err) {
      if (prev) set((s) => ({ investigations: s.investigations.map((inv) => (inv.id === investigationId ? prev : inv)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },

  // ─── SourceExcerpts ────────────────────────────────────────
  addSourceExcerpt: async (data) => {
    const optimistic: SourceExcerpt = { ...data, id: genId(), createdAt: now(), updatedAt: now() };
    set((s) => ({ sourceExcerpts: [optimistic, ...s.sourceExcerpts] }));
    try {
      const saved = await createSourceExcerpt(data);
      set((s) => ({ sourceExcerpts: s.sourceExcerpts.map((e) => (e.id === optimistic.id ? saved : e)) }));
      return saved;
    } catch (err) {
      set((s) => ({ sourceExcerpts: s.sourceExcerpts.filter((e) => e.id !== optimistic.id), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  updateSourceExcerpt: async (id, updates) => {
    const prev = get().sourceExcerpts.find((e) => e.id === id);
    set((s) => ({ sourceExcerpts: s.sourceExcerpts.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: now() } : e)) }));
    try {
      const saved = await apiUpdateSourceExcerpt(id, updates);
      set((s) => ({ sourceExcerpts: s.sourceExcerpts.map((e) => (e.id === id ? saved : e)) }));
    } catch (err) {
      if (prev) set((s) => ({ sourceExcerpts: s.sourceExcerpts.map((e) => (e.id === id ? prev : e)), syncError: 'שגיאה בשמירה — נסה שוב' }));
      throw err;
    }
  },
  deleteSourceExcerpt: async (id) => {
    const prev = get().sourceExcerpts;
    set((s) => ({ sourceExcerpts: s.sourceExcerpts.filter((e) => e.id !== id) }));
    try {
      await apiDeleteSourceExcerpt(id);
    } catch (err) {
      set({ sourceExcerpts: prev, syncError: 'שגיאה בשמירה — נסה שוב' });
      throw err;
    }
  },

  // ─── Export / Import (JSON backup, in-memory) ──────────────
  exportToJSON: () => {
    const { categories, subCategories, subQuestions, investigations, insights, finalOutputs, sourceExcerpts } = get();
    return JSON.stringify({ categories, subCategories, subQuestions, investigations, insights, finalOutputs, sourceExcerpts }, null, 2);
  },
  importFromJSON: (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.categories) return false;
      const migratedSQs: SubQuestion[] = (data.subQuestions ?? []).map(
        (sq: SubQuestion, idx: number) => ({
          ...sq,
          order: sq.order ?? idx,
          subCategoryId: sq.subCategoryId ?? null,
        })
      );
      set({
        categories: data.categories ?? [],
        subCategories: data.subCategories ?? [],
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

  clearSyncError: () => set({ syncError: null }),
}));
