import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { LoginView } from './views/LoginView';
import { Home } from './views/Home';
import { Categories } from './views/Categories';
import { Investigations } from './views/Investigations';
import { InvestigationDetail } from './views/InvestigationDetail';
import { InsightsView } from './views/InsightsView';
import { FinalOutputView } from './views/FinalOutputView';
import { ResearchMap } from './views/ResearchMap';
import { SourcesView } from './views/SourcesView';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const sessionActive = (() => {
    try { return sessionStorage.getItem('mt-session') === 'active'; } catch { return false; }
  })();
  if (!isAuthenticated && !sessionActive) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="categories" element={<Categories />} />
        <Route path="investigations" element={<Investigations />} />
        <Route path="investigations/:id" element={<InvestigationDetail />} />
        <Route path="insights" element={<InsightsView />} />
        <Route path="output" element={<FinalOutputView />} />
        <Route path="map" element={<ResearchMap />} />
        <Route path="sources" element={<SourcesView />} />
      </Route>
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/research-engine">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
