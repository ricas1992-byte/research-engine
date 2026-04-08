import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { Categories } from './views/Categories';
import { Investigations } from './views/Investigations';
import { InsightsView } from './views/InsightsView';
import { FinalOutputView } from './views/FinalOutputView';
import { ResearchMap } from './views/ResearchMap';

export default function App() {
  return (
    <BrowserRouter basename="/research-engine">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="categories" element={<Categories />} />
          <Route path="investigations" element={<Investigations />} />
          <Route path="insights" element={<InsightsView />} />
          <Route path="output" element={<FinalOutputView />} />
          <Route path="map" element={<ResearchMap />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
