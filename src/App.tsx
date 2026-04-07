import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { InsightEditor } from './views/InsightEditor';
import { SourceManager } from './views/SourceManager';
import { CrossRefMap } from './views/CrossRefMap';
import { BlindSpots } from './views/BlindSpots';
import { ZachariaReport } from './views/ZachariaReport';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="editor" element={<InsightEditor />} />
          <Route path="editor/:id" element={<InsightEditor />} />
          <Route path="sources" element={<SourceManager />} />
          <Route path="map" element={<CrossRefMap />} />
          <Route path="blindspots" element={<BlindSpots />} />
          <Route path="report" element={<ZachariaReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
