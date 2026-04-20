import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { Categories } from './views/Categories';
import { Investigations } from './views/Investigations';
import { InvestigationDetail } from './views/InvestigationDetail';
import { InsightsView } from './views/InsightsView';
import { FinalOutputView } from './views/FinalOutputView';
import { ResearchMap } from './views/ResearchMap';
import { SourcesView } from './views/SourcesView';
import { ProjectsView } from './views/ProjectsView';
import { AuthCallback } from './features/auth/AuthCallback'
import { useStore } from './data/store';
import { runMigration } from './lib/migrateFromLocalStorage';
import { startRealtime, stopRealtime } from './lib/realtime';

function AppShell() {
  const { user } = useAuth();
  const { hydrateFromSupabase } = useStore();
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
      .then(() => { if (active) startRealtime(); })
      .catch(console.error);

    return () => { active = false; };
  }, [user, hydrateFromSupabase]);

  return (
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
        <Route path="map" element={<ResearchMap />} />
        <Route path="sources" element={<SourcesView />} />
      </Route>
      <Route path="/auth/callback" element={<AuthCallback />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/research-engine">
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
