import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Category, SubQuestion, Investigation, Insight, FinalOutput, RawMaterial } from '../types/index';

interface StoreState {
  categories: Category[];
  subQuestions: SubQuestion[];
  investigations: Investigation[];
  insights: Insight[];
  finalOutputs: FinalOutput[];

  // Category CRUD
  addCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Category;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>) => void;
  deleteCategory: (id: string) => void;

  // SubQuestion CRUD
  addSubQuestion: (data: Omit<SubQuestion, 'id' | 'createdAt' | 'updatedAt'>) => SubQuestion;
  updateSubQuestion: (id: string, updates: Partial<Omit<SubQuestion, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteSubQuestion: (id: string) => void;

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

      addSubQuestion: (data) => {
        const item: SubQuestion = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
        set((s) => ({ subQuestions: [item, ...s.subQuestions] }));
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
        set((s) => ({ investigations: s.investigations.filter((inv) => inv.id !== id) }));
      },

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

      exportToJSON: () => {
        const { categories, subQuestions, investigations, insights, finalOutputs } = get();
        return JSON.stringify({ categories, subQuestions, investigations, insights, finalOutputs }, null, 2);
      },
      importFromJSON: (jsonStr) => {
        try {
          const data = JSON.parse(jsonStr);
          if (!data.categories) return false;
          set({
            categories: data.categories ?? [],
            subQuestions: data.subQuestions ?? [],
            investigations: data.investigations ?? [],
            insights: data.insights ?? [],
            finalOutputs: data.finalOutputs ?? [],
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'musical-thinking-v2',
      partialize: (state) => ({
        categories: state.categories,
        subQuestions: state.subQuestions,
        investigations: state.investigations,
        insights: state.insights,
        finalOutputs: state.finalOutputs,
      }),
    }
  )
);
