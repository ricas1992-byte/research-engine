import { useState } from 'react';
import { useProjectStore } from '../data/projectStore';
import type { Project } from '../data/projectStore';

function ProjectCard({ project, isActive, onSetActive }: {
  project: Project;
  isActive: boolean;
  onSetActive: () => void;
}) {
  const frameworkEntries = Object.entries(project.framework);
  const successor = useProjectStore((s) => s.getProjectById(project.successorProjectId ?? ''));

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
      isActive ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
    } ${project.status === 'archived' ? 'opacity-80' : ''}`}>
      {/* Card header */}
      <div className={`px-5 py-4 border-b ${isActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-800 text-base">{project.name}</h3>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                v{project.version}
              </span>
              {project.status === 'active' && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  פעיל
                </span>
              )}
              {project.status === 'archived' && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  מאורכב
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              נוצר: {new Date(project.createdAt).toLocaleDateString('he-IL')}
              {project.archivedAt && ` · אורכב: ${new Date(project.archivedAt).toLocaleDateString('he-IL')}`}
            </p>
          </div>
          {project.status === 'active' && !isActive && (
            <button
              type="button"
              onClick={onSetActive}
              className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex-shrink-0"
            >
              הפעל
            </button>
          )}
          {isActive && (
            <span className="text-xs text-indigo-600 font-semibold flex-shrink-0">✓ פעיל כעת</span>
          )}
        </div>
      </div>

      {/* Research question */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">שאלת מחקר</p>
          <blockquote className="text-sm text-slate-700 leading-relaxed border-r-2 border-indigo-300 pr-3">
            {project.researchQuestion}
          </blockquote>
        </div>

        {/* Framework */}
        {frameworkEntries.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">מסגרת מושגית</p>
            <div className="grid grid-cols-2 gap-2">
              {frameworkEntries.map(([term, def]) => (
                <div key={term} className="bg-slate-50 rounded-lg p-2.5">
                  <p className="font-semibold text-slate-700 text-xs mb-0.5">{term}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{def}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archive metadata */}
        {project.status === 'archived' && project.archiveReason && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-700">
              <span className="font-semibold">סיבת ארכוב:</span> {project.archiveReason}
            </p>
            {successor && (
              <p className="text-xs text-amber-600 mt-1">
                <span className="font-semibold">יורש:</span> {successor.name} v{successor.version}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectsView() {
  const {
    projects, activeProjectId,
    getActiveProjects, getArchivedProjects,
    setActiveProject,
  } = useProjectStore();

  const [tab, setTab] = useState<'active' | 'archive'>('active');

  const activeProjects = getActiveProjects();
  const archivedProjects = getArchivedProjects();
  const visibleProjects = tab === 'active' ? activeProjects : archivedProjects;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">פרויקטי מחקר</h1>
        <span className="text-xs text-slate-400">
          {projects.length} פרויקטים · {activeProjects.length} פעילים · {archivedProjects.length} מאורכבים
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'active' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          פעילים ({activeProjects.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('archive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'archive' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ארכיון ({archivedProjects.length})
        </button>
      </div>

      {tab === 'archive' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          <span className="font-semibold">מצב ארכיון — קריאה בלבד.</span> פרויקטים מאורכבים ונתוניהם נשמרים אך לא ניתן לערוך אותם.
        </div>
      )}

      <div className="space-y-4">
        {visibleProjects.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">
            {tab === 'active' ? 'אין פרויקטים פעילים.' : 'אין פרויקטים מאורכבים.'}
          </p>
        )}
        {visibleProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            isActive={project.id === activeProjectId}
            onSetActive={() => setActiveProject(project.id)}
          />
        ))}
      </div>
    </div>
  );
}
