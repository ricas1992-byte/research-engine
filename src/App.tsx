import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthCallback } from './features/auth/AuthCallback'
import { useStore } from './data/store';
import { useProjectStore } from './data/projectStore';
import { runMigration } from './lib/migrateFromLocalStorage';
import { startRealtime, stopRealtime } from './lib/realtime';
import { logger } from './lib/logger';
import { featureFlags } from './lib/featureFlags';

const Home = lazy(() => import('./views/Home').then((m) => ({ default: m.Home })));
const Categories = lazy(() => import('./views/Categories').then((m) => ({ default: m.Categories })));
const Investigations = lazy(() => import('./views/Investigations').then((m) => ({ default: m.Investigations })));
const InvestigationDetail = lazy(() => import('./views/InvestigationDetail').then((m) => ({ default: m.InvestigationDetail })));
const InsightsView = lazy(() => import('./views/InsightsView').then((m) => ({ default: m.InsightsView })));
const FinalOutputView = lazy(() => import('./views/FinalOutputView').then((m) => ({ default: m.FinalOutputView })));
const ResearchMap = lazy(() => import('./views/ResearchMap').then((m) => ({ default: m.ResearchMap })));
const SourcesView = lazy(() => import('./views/SourcesView').then((m) => ({ default: m.SourcesView })));
const ProjectsView = lazy(() => import('./views/ProjectsView').then((m) => ({ default: m.ProjectsView })));

function ViewFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
      <span className="text-sm text-slate-400" aria-live="polite">טוען…</span>
    </div>
  );
}

function AppShell() {
  const { user } = useAuth();
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase);
  const hydrateMap = useProjectStore((s) => s.hydrateMapFromSupabase);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      hydratedRef.current = false;
      stopRealtime();
      return;
    }
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    let active = true;
    runMigration()
      .then(() => hydrateFromSupabase())
      .then(() => hydrateMap())
      .then(() => { if (active) startRealtime(); })
      .catch((err) => logger.error('app-shell', 'hydration failed', err));

    return () => { active = false; };
  }, [user, hydrateFromSupabase, hydrateMap]);

  return (
    <Suspense fallback={<ViewFallback />}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="projects" element={<ProjectsView />} />
          <Route path="categories" element={<Categories />} />
          <Route path="investigations" element={<Investigations />} />
          <Route path="investigations/:id" element={<InvestigationDetail />} />
          <Route path="insights" element={<InsightsView />} />
          <Route path="output" element={<FinalOutputView />} />
          {featureFlags.researchMap && <Route path="map" element={<ResearchMap />} />}
          {featureFlags.sourcesView && <Route path="sources" element={<SourcesView />} />}
        </Route>
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const basename = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') || '/';
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
