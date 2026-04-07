import { useState } from 'react';
import { useStore } from '../data/store';
import { NetworkGraph } from '../components/NetworkGraph';
import type { Axis, CrossRefType } from '../types/insight';
import { CROSSREF_COLORS, CROSSREF_LABELS, AXIS_COLORS } from '../utils/colors';
import { AxisBadge } from '../components/AxisBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ConfidenceBar } from '../components/ConfidenceBar';

const ALL_AXES: Axis[] = ['כללי', 'תיאורטי', 'ביצועי', 'פסיכולוגי', 'מוסדי', 'פדגוגי'];
const ALL_REF_TYPES: CrossRefType[] = ['supports', 'contradicts', 'extends', 'blind_spot', 'pattern'];

type GraphNode = {
  id: string;
  label: string;
  kind: 'insight' | 'source';
  axis?: string;
  connections: number;
  data: unknown;
};

type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
  type: CrossRefType;
  confidence: number;
  explanation: string;
  zachpiracyQuestion: string;
  id: string;
};

export function CrossRefMap() {
  const { insights, sources, crossRefs, deleteCrossRef } = useStore();
  const [filterAxis, setFilterAxis] = useState<Axis | ''>('');
  const [filterRound, setFilterRound] = useState<number | undefined>();
  const [filterRefType, setFilterRefType] = useState<CrossRefType | ''>('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'node' | 'link' | 'legend'>('legend');

  const maxRound = Math.max(...insights.map((i) => i.round), 1);
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  const isolatedCount = insights.filter((ins) => {
    return !crossRefs.some((r) => r.insightId === ins.id || r.targetId === ins.id);
  }).length;

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setSelectedLink(null);
    setSidebarTab('node');
  };

  const handleLinkClick = (link: GraphLink) => {
    setSelectedLink(link);
    setSelectedNode(null);
    setSidebarTab('link');
  };

  const nodeInsight = selectedNode?.kind === 'insight'
    ? insights.find((i) => i.id === selectedNode.id)
    : null;
  const nodeSource = selectedNode?.kind === 'source'
    ? sources.find((s) => s.id === selectedNode.id)
    : null;

  const nodeCrossRefs = selectedNode
    ? crossRefs.filter((r) => r.insightId === selectedNode.id || r.targetId === selectedNode.id)
    : [];

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      {/* Graph area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="font-bold text-gray-800 text-lg font-hebrew">מפת הצלבות</h1>

          <select
            value={filterAxis}
            onChange={(e) => setFilterAxis(e.target.value as Axis | '')}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">כל הצירים</option>
            {ALL_AXES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={filterRound ?? ''}
            onChange={(e) => setFilterRound(e.target.value ? parseInt(e.target.value) : undefined)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">כל הסבבים</option>
            {rounds.map((r) => <option key={r} value={r}>סבב {r}</option>)}
          </select>

          <select
            value={filterRefType}
            onChange={(e) => setFilterRefType(e.target.value as CrossRefType | '')}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">כל סוגי הקשרים</option>
            {ALL_REF_TYPES.map((t) => <option key={t} value={t}>{CROSSREF_LABELS[t]}</option>)}
          </select>

          {(filterAxis || filterRound || filterRefType) && (
            <button
              onClick={() => { setFilterAxis(''); setFilterRound(undefined); setFilterRefType(''); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕ נקה
            </button>
          )}

          <div className="mr-auto flex items-center gap-3 text-xs text-gray-400">
            <span>{insights.length} תובנות</span>
            <span>{crossRefs.length} הצלבות</span>
            {isolatedCount > 0 && (
              <span className="text-amber-600 font-medium">{isolatedCount} מבודדות</span>
            )}
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 overflow-hidden p-3">
          <NetworkGraph
            insights={insights}
            sources={sources}
            crossRefs={crossRefs}
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            filterAxis={filterAxis || undefined}
            filterRound={filterRound}
            filterRefType={filterRefType || undefined}
          />
        </div>
      </div>

      {/* Right panel */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Tab switcher */}
        <div className="flex border-b border-gray-200">
          {(['legend', 'node', 'link'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                sidebarTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'legend' ? 'מקרא' : tab === 'node' ? 'צומת' : 'קשר'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Legend */}
          {sidebarTab === 'legend' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">צבעי צירים</h3>
                {ALL_AXES.map((axis) => (
                  <div key={axis} className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: AXIS_COLORS[axis].graph }}
                    />
                    <span className="text-sm text-gray-600">{axis}</span>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">סוגי קשרים</h3>
                {ALL_REF_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-6 h-0.5 flex-shrink-0"
                      style={{ backgroundColor: CROSSREF_COLORS[type] }}
                    />
                    <span className="text-sm text-gray-600">{CROSSREF_LABELS[type]}</span>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">צורות</h3>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-4 h-4 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">תובנה</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-4 h-4 bg-blue-400 flex-shrink-0 rounded-sm" />
                  <span className="text-sm text-gray-600">מקור</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-dashed flex-shrink-0" />
                  <span className="text-sm text-gray-600">תובנה מבודדת</span>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                גרור צמתים לארגון ידני. גלגל עכבר לזום. לחץ על צומת/קשר לפרטים.
              </p>
            </div>
          )}

          {/* Node detail */}
          {sidebarTab === 'node' && selectedNode && (
            <div className="space-y-3">
              {nodeInsight && (
                <>
                  <div className="flex gap-2 flex-wrap">
                    <AxisBadge axis={nodeInsight.axis} />
                    <StatusBadge status={nodeInsight.status} />
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      סבב {nodeInsight.round}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{nodeInsight.content}</p>
                  {nodeInsight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {nodeInsight.tags.map((t) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">#{t}</span>
                      ))}
                    </div>
                  )}
                  {nodeInsight.zachariasQuestion && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="text-xs text-amber-700 italic">{nodeInsight.zachariasQuestion}</p>
                    </div>
                  )}
                </>
              )}
              {nodeSource && (
                <>
                  <div className="font-semibold text-gray-800">{nodeSource.title}</div>
                  <div className="text-sm text-gray-500">{nodeSource.author}</div>
                  <p className="text-sm text-gray-700 italic">"{nodeSource.content}"</p>
                  <div className="flex gap-1 flex-wrap">
                    {nodeSource.axes.map((a) => <AxisBadge key={a} axis={a} size="sm" />)}
                  </div>
                </>
              )}

              {nodeCrossRefs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    הצלבות ({nodeCrossRefs.length})
                  </h3>
                  {nodeCrossRefs.map((ref) => (
                    <div key={ref.id} className="border rounded p-2 mb-2 text-xs">
                      <div
                        className="font-bold mb-1"
                        style={{ color: CROSSREF_COLORS[ref.type] }}
                      >
                        {CROSSREF_LABELS[ref.type]}
                      </div>
                      <p className="text-gray-600">{ref.explanation}</p>
                      <ConfidenceBar confidence={ref.confidence} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Link detail */}
          {sidebarTab === 'link' && selectedLink && (
            <div className="space-y-3">
              <div
                className="inline-flex items-center text-sm font-bold px-3 py-1.5 rounded-full text-white"
                style={{ backgroundColor: CROSSREF_COLORS[selectedLink.type] }}
              >
                {CROSSREF_LABELS[selectedLink.type]}
              </div>

              <p className="text-gray-700 leading-relaxed">{selectedLink.explanation}</p>

              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-xs font-bold text-amber-600 mb-1">שאלת זכריה:</p>
                <p className="text-sm text-amber-800 italic">{selectedLink.zachpiracyQuestion}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">ביטחון</p>
                <ConfidenceBar confidence={selectedLink.confidence} />
              </div>

              <button
                onClick={() => {
                  deleteCrossRef(selectedLink.id);
                  setSelectedLink(null);
                  setSidebarTab('legend');
                }}
                className="w-full text-sm py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                מחק הצלבה זו
              </button>
            </div>
          )}

          {sidebarTab === 'node' && !selectedNode && (
            <p className="text-gray-400 text-sm text-center mt-8">לחץ על צומת בגרף לצפייה בפרטים</p>
          )}
          {sidebarTab === 'link' && !selectedLink && (
            <p className="text-gray-400 text-sm text-center mt-8">לחץ על קשר בגרף לצפייה בפרטים</p>
          )}
        </div>
      </aside>
    </div>
  );
}
