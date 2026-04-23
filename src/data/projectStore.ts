import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  fetchCategoryProjectMap,
  upsertCategoryProjectAssignment,
  bulkUploadCategoryProjectMap,
} from '../lib/api/categoryProjectMap';
import { logger } from '../lib/logger';

export interface Project {
  id: string;
  name: string;
  version: number;
  status: 'active' | 'archived';
  researchQuestion: string;
  framework: Record<string, string>;
  predecessorProjectId: string | null;
  successorProjectId: string | null;
  createdAt: string;
  archivedAt?: string;
  archiveReason?: string;
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'periphery-v1',
    name: 'פרויקט הפריפריה',
    version: 1,
    status: 'archived',
    researchQuestion:
      'אתה מהלך בפריפריה של העולם המופלא של המוסיקה ולכן יש לך זווית ראיה ייחודית. מה אתה רואה שהאדם מבפנים לא רואה?',
    framework: {},
    predecessorProjectId: null,
    successorProjectId: 'periphery-v2',
    createdAt: '2026-01-01T00:00:00.000Z',
    archivedAt: '2026-04-18T00:00:00.000Z',
    archiveReason: 'שאלת המחקר התעדכנה — ראה periphery-v2',
  },
  {
    id: 'periphery-v2',
    name: 'פרויקט הפריפריה',
    version: 2,
    status: 'active',
    researchQuestion:
      'איך יוצרים איזון בין דיגיטציה (טכניקה ודיוק בפרטים הדידקטיים) לפרשנות אומנותית (מה עומד מאחורי התווים)?',
    framework: {
      פריפריה: 'מקומות ללא כוח תבוני לפרשנות אומנותית עצמאית',
      מטרופולין:
        'מקומות בעלי צבר של אנשים עם כוח תבוני המאזן בין פרשנות אומנותית לדיגיטציה',
      דיגיטציה: 'טכניקה ודיוק בפרטים הדידקטיים',
      'פרשנות אומנותית': 'מה שעומד מאחורי התווים',
    },
    predecessorProjectId: 'periphery-v1',
    successorProjectId: null,
    createdAt: '2026-04-18T00:00:00.000Z',
  },
];

interface ProjectStoreState {
  projects: Project[];
  activeProjectId: string;
  /** categoryId → projectId. Kept in sync with Supabase `category_project_map`. */
  categoryProjectMap: Record<string, string>;

  getActiveProject: () => Project | undefined;
  getProjectById: (id: string) => Project | undefined;
  getActiveProjects: () => Project[];
  getArchivedProjects: () => Project[];
  setActiveProject: (id: string) => void;
  archiveProject: (id: string, reason: string, successorId?: string) => void;
  createProject: (data: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  assignCategoryToProject: (categoryId: string, projectId: string) => void;
  getProjectIdForCategory: (categoryId: string) => string;

  /** Pull the map from Supabase and upload any localStorage-only assignments. */
  hydrateMapFromSupabase: () => Promise<void>;
  /** Reset everything — called on sign-out so next user starts clean. */
  resetToDefaults: () => void;
}

const LOCALSTORAGE_KEY = 'musical-thinking-projects';

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_PROJECTS,
      activeProjectId: 'periphery-v2',
      categoryProjectMap: {},

      getActiveProject: () =>
        get().projects.find((p) => p.id === get().activeProjectId),

      getProjectById: (id) => get().projects.find((p) => p.id === id),

      getActiveProjects: () =>
        get().projects.filter((p) => p.status === 'active'),

      getArchivedProjects: () =>
        get().projects.filter((p) => p.status === 'archived'),

      setActiveProject: (id) => set({ activeProjectId: id }),

      archiveProject: (id, reason, successorId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'archived' as const,
                  archivedAt: new Date().toISOString(),
                  archiveReason: reason,
                  ...(successorId ? { successorProjectId: successorId } : {}),
                }
              : p
          ),
        })),

      createProject: (data) => {
        const newProject: Project = {
          ...data,
          id: `project-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ projects: [...s.projects, newProject] }));
        return newProject;
      },

      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      assignCategoryToProject: (categoryId, projectId) => {
        // Optimistic update, then persist to Supabase in the background
        set((s) => ({
          categoryProjectMap: { ...s.categoryProjectMap, [categoryId]: projectId },
        }));
        upsertCategoryProjectAssignment(categoryId, projectId).catch((err) => {
          logger.warn('projectStore', 'assignCategoryToProject failed', err);
        });
      },

      getProjectIdForCategory: (categoryId) =>
        get().categoryProjectMap[categoryId] ?? 'periphery-v1',

      hydrateMapFromSupabase: async () => {
        try {
          const remote = await fetchCategoryProjectMap();
          const local = get().categoryProjectMap;
          // Upload anything that exists locally but not remotely (first login after migration)
          const missing: Record<string, string> = {};
          for (const [catId, projId] of Object.entries(local)) {
            if (!(catId in remote)) missing[catId] = projId;
          }
          if (Object.keys(missing).length > 0) {
            await bulkUploadCategoryProjectMap(missing);
          }
          // Remote wins on conflict
          set({ categoryProjectMap: { ...local, ...remote } });
        } catch (err) {
          logger.warn('projectStore', 'hydrateMapFromSupabase failed', err);
        }
      },

      resetToDefaults: () => {
        set({
          projects: INITIAL_PROJECTS,
          activeProjectId: 'periphery-v2',
          categoryProjectMap: {},
        });
        try {
          localStorage.removeItem(LOCALSTORAGE_KEY);
        } catch {
          // Ignore — non-fatal
        }
      },
    }),
    { name: LOCALSTORAGE_KEY }
  )
);
