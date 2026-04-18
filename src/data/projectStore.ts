import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  /** categoryId → projectId. Categories NOT in this map belong to 'periphery-v1' by default. */
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
}

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

      assignCategoryToProject: (categoryId, projectId) =>
        set((s) => ({
          categoryProjectMap: { ...s.categoryProjectMap, [categoryId]: projectId },
        })),

      getProjectIdForCategory: (categoryId) =>
        get().categoryProjectMap[categoryId] ?? 'periphery-v1',
    }),
    { name: 'musical-thinking-projects' }
  )
);
