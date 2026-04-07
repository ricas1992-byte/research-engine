import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Insight, Source, CrossReference } from '../types/insight';
import type { BlindSpot, Pattern } from '../types/analysis';
import { findTextualMatches } from '../engine/textual-matcher';
import { detectBlindSpots } from '../engine/blind-spot-detector';
import { findPatterns } from '../engine/pattern-finder';
import { analyzeInsightWithSources } from '../engine/semantic-analyzer';
import seedInsights from './seed-insights.json';
import seedSources from './seed-sources.json';

interface AnalysisState {
  isAnalyzing: boolean;
  analysisProgress: string;
  lastAnalyzedAt: string | null;
}

interface StoreState {
  insights: Insight[];
  sources: Source[];
  crossRefs: CrossReference[];
  blindSpots: BlindSpot[];
  patterns: Pattern[];
  analysis: AnalysisState;

  // Insight CRUD
  addInsight: (insight: Insight) => void;
  updateInsight: (id: string, updates: Partial<Insight>) => void;
  deleteInsight: (id: string) => void;

  // Source CRUD
  addSource: (source: Source) => void;
  updateSource: (id: string, updates: Partial<Source>) => void;
  deleteSource: (id: string) => void;

  // CrossRef CRUD
  addCrossRef: (ref: CrossReference) => void;
  deleteCrossRef: (id: string) => void;

  // BlindSpot CRUD
  updateBlindSpot: (id: string, updates: Partial<BlindSpot>) => void;

  // Analysis actions
  runTextualAnalysis: (insightId: string) => void;
  runSemanticAnalysis: (insightId: string) => Promise<void>;
  detectBlindSpots: () => void;
  findPatterns: () => void;
  rescanAll: () => Promise<void>;

  // Import/Export
  exportToJSON: () => string;
  importFromJSON: (jsonStr: string) => boolean;

  // Seed
  loadSeedData: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      insights: [],
      sources: [],
      crossRefs: [],
      blindSpots: [],
      patterns: [],
      analysis: {
        isAnalyzing: false,
        analysisProgress: '',
        lastAnalyzedAt: null,
      },

      addInsight: (insight) => {
        set((state) => ({ insights: [insight, ...state.insights] }));
        // Auto-run textual analysis
        get().runTextualAnalysis(insight.id);
      },

      updateInsight: (id, updates) => {
        set((state) => ({
          insights: state.insights.map((ins) =>
            ins.id === id ? { ...ins, ...updates, updatedAt: new Date().toISOString() } : ins
          ),
        }));
        get().runTextualAnalysis(id);
      },

      deleteInsight: (id) => {
        set((state) => ({
          insights: state.insights.filter((ins) => ins.id !== id),
          crossRefs: state.crossRefs.filter(
            (ref) => ref.insightId !== id && ref.targetId !== id
          ),
        }));
      },

      addSource: (source) => {
        set((state) => ({ sources: [source, ...state.sources] }));
      },

      updateSource: (id, updates) => {
        set((state) => ({
          sources: state.sources.map((src) =>
            src.id === id ? { ...src, ...updates } : src
          ),
        }));
      },

      deleteSource: (id) => {
        set((state) => ({
          sources: state.sources.filter((src) => src.id !== id),
          crossRefs: state.crossRefs.filter((ref) => ref.targetId !== id),
        }));
      },

      addCrossRef: (ref) => {
        set((state) => {
          // Avoid exact duplicates
          const exists = state.crossRefs.some(
            (r) =>
              r.insightId === ref.insightId &&
              r.targetId === ref.targetId &&
              r.type === ref.type
          );
          if (exists) return state;
          return { crossRefs: [ref, ...state.crossRefs] };
        });
      },

      deleteCrossRef: (id) => {
        set((state) => ({
          crossRefs: state.crossRefs.filter((ref) => ref.id !== id),
        }));
      },

      updateBlindSpot: (id, updates) => {
        set((state) => ({
          blindSpots: state.blindSpots.map((bs) =>
            bs.id === id ? { ...bs, ...updates } : bs
          ),
        }));
      },

      runTextualAnalysis: (insightId) => {
        const { insights, sources, addCrossRef } = get();
        const insight = insights.find((ins) => ins.id === insightId);
        if (!insight) return;

        const newRefs = findTextualMatches(insight, insights, sources);
        newRefs.forEach((ref) => addCrossRef(ref));
      },

      runSemanticAnalysis: async (insightId) => {
        const { insights, sources, addCrossRef } = get();
        const insight = insights.find((ins) => ins.id === insightId);
        if (!insight) return;

        set((state) => ({
          analysis: {
            ...state.analysis,
            isAnalyzing: true,
            analysisProgress: `מנתח תובנה: ${insight.content.slice(0, 40)}...`,
          },
        }));

        try {
          const newRefs = await analyzeInsightWithSources(insight, insights, sources);
          newRefs.forEach((ref) => addCrossRef(ref));
        } finally {
          set((state) => ({
            analysis: {
              ...state.analysis,
              isAnalyzing: false,
              analysisProgress: '',
              lastAnalyzedAt: new Date().toISOString(),
            },
          }));
        }
      },

      detectBlindSpots: () => {
        const { insights, sources, crossRefs } = get();
        const spots = detectBlindSpots(insights, sources, crossRefs);
        set({ blindSpots: spots });
      },

      findPatterns: () => {
        const { insights, crossRefs } = get();
        const pats = findPatterns(insights, crossRefs);
        set({ patterns: pats });
      },

      rescanAll: async () => {
        const { insights, runTextualAnalysis, detectBlindSpots: detect, findPatterns: fp } = get();

        set((state) => ({
          analysis: { ...state.analysis, isAnalyzing: true, analysisProgress: 'סריקה מחדש של כל התובנות...' },
        }));

        // Clear all engine-discovered cross-refs
        set((state) => ({
          crossRefs: state.crossRefs.filter((ref) => ref.discoveredBy === 'manual'),
        }));

        // Re-run textual on each insight with small delay to avoid blocking UI
        for (const insight of insights) {
          runTextualAnalysis(insight.id);
          await new Promise((r) => setTimeout(r, 10));
        }

        detect();
        fp();

        set((state) => ({
          analysis: { ...state.analysis, isAnalyzing: false, analysisProgress: '', lastAnalyzedAt: new Date().toISOString() },
        }));
      },

      exportToJSON: () => {
        const { insights, sources, crossRefs, blindSpots, patterns } = get();
        return JSON.stringify({ insights, sources, crossRefs, blindSpots, patterns }, null, 2);
      },

      importFromJSON: (jsonStr) => {
        try {
          const data = JSON.parse(jsonStr);
          if (!data.insights || !data.sources) return false;
          set({
            insights: data.insights ?? [],
            sources: data.sources ?? [],
            crossRefs: data.crossRefs ?? [],
            blindSpots: data.blindSpots ?? [],
            patterns: data.patterns ?? [],
          });
          return true;
        } catch {
          return false;
        }
      },

      loadSeedData: () => {
        const state = get();
        if (state.insights.length > 0 || state.sources.length > 0) return;
        set({
          insights: seedInsights as Insight[],
          sources: seedSources as Source[],
        });
        // Run textual analysis on seed insights
        setTimeout(() => {
          const { insights, runTextualAnalysis, detectBlindSpots: detect, findPatterns: fp } = get();
          insights.forEach((ins) => runTextualAnalysis(ins.id));
          detect();
          fp();
        }, 100);
      },
    }),
    {
      name: 'research-engine',
      partialize: (state) => ({
        insights: state.insights,
        sources: state.sources,
        crossRefs: state.crossRefs,
        blindSpots: state.blindSpots,
        patterns: state.patterns,
      }),
    }
  )
);
