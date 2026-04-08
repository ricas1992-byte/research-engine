import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useStore } from '../data/store';
import { RESEARCH_QUESTION } from '../types/index';
import type { Category, SubQuestion, Investigation, Insight } from '../types/index';

type NodeType = 'root' | 'category' | 'subQuestion' | 'investigation' | 'insight';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: NodeType;
  label: string;
  color: string;
  categoryId?: string;
  entityId: string;
  r: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface SidebarItem {
  type: NodeType;
  label: string;
  extra?: string;
  color: string;
}

const NODE_RADIUS: Record<NodeType, number> = {
  root:          36,
  category:      22,
  subQuestion:   16,
  investigation: 12,
  insight:        8,
};

const LEVEL_VISIBLE: Record<NodeType, boolean> = {
  root:          true,
  category:      true,
  subQuestion:   true,
  investigation: true,
  insight:       true,
};

export function ResearchMap() {
  const { categories, subQuestions, investigations, insights } = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebar, setSidebar] = useState<SidebarItem | null>(null);
  const [visibleLevels, setVisibleLevels] = useState<Record<NodeType, boolean>>({ ...LEVEL_VISIBLE });

  const buildGraph = useCallback((): { nodes: GraphNode[]; links: GraphLink[] } => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Root
    const rootId = '__root__';
    nodes.push({
      id: rootId,
      type: 'root',
      label: 'שאלת המחקר',
      color: '#1e293b',
      entityId: rootId,
      r: NODE_RADIUS.root,
    });

    // Categories
    categories.forEach((cat: Category) => {
      if (!visibleLevels.category) return;
      nodes.push({
        id: `cat_${cat.id}`,
        type: 'category',
        label: cat.name,
        color: cat.color,
        categoryId: cat.id,
        entityId: cat.id,
        r: NODE_RADIUS.category,
      });
      links.push({ source: rootId, target: `cat_${cat.id}` });
    });

    // Sub-questions
    subQuestions.forEach((sq: SubQuestion) => {
      if (!visibleLevels.subQuestion) return;
      const cat = categories.find((c: Category) => c.id === sq.categoryId);
      nodes.push({
        id: `sq_${sq.id}`,
        type: 'subQuestion',
        label: sq.text.length > 40 ? sq.text.slice(0, 40) + '…' : sq.text,
        color: cat?.color ?? '#94a3b8',
        categoryId: sq.categoryId,
        entityId: sq.id,
        r: NODE_RADIUS.subQuestion,
      });
      if (visibleLevels.category) {
        links.push({ source: `cat_${sq.categoryId}`, target: `sq_${sq.id}` });
      } else {
        links.push({ source: rootId, target: `sq_${sq.id}` });
      }
    });

    // Investigations
    investigations.forEach((inv: Investigation) => {
      if (!visibleLevels.investigation) return;
      const sq = subQuestions.find((s: SubQuestion) => s.id === inv.subQuestionId);
      const cat = sq ? categories.find((c: Category) => c.id === sq.categoryId) : null;
      nodes.push({
        id: `inv_${inv.id}`,
        type: 'investigation',
        label: inv.title.length > 35 ? inv.title.slice(0, 35) + '…' : inv.title,
        color: cat?.color ?? '#94a3b8',
        categoryId: sq?.categoryId,
        entityId: inv.id,
        r: NODE_RADIUS.investigation,
      });
      if (visibleLevels.subQuestion && sq) {
        links.push({ source: `sq_${sq.id}`, target: `inv_${inv.id}` });
      } else if (visibleLevels.category && sq) {
        links.push({ source: `cat_${sq.categoryId}`, target: `inv_${inv.id}` });
      } else {
        links.push({ source: rootId, target: `inv_${inv.id}` });
      }
    });

    // Insights
    if (visibleLevels.insight && insights.length <= 200) {
      insights.forEach((ins: Insight) => {
        const inv = investigations.find((i: Investigation) => i.id === ins.investigationId);
        const sq = inv ? subQuestions.find((s: SubQuestion) => s.id === inv.subQuestionId) : null;
        const cat = sq ? categories.find((c: Category) => c.id === sq.categoryId) : null;
        nodes.push({
          id: `ins_${ins.id}`,
          type: 'insight',
          label: ins.text.length > 30 ? ins.text.slice(0, 30) + '…' : ins.text,
          color: cat?.color ?? '#94a3b8',
          categoryId: sq?.categoryId,
          entityId: ins.id,
          r: NODE_RADIUS.insight,
        });
        if (visibleLevels.investigation && inv) {
          links.push({ source: `inv_${inv.id}`, target: `ins_${ins.id}` });
        } else if (visibleLevels.subQuestion && sq) {
          links.push({ source: `sq_${sq.id}`, target: `ins_${ins.id}` });
        } else {
          links.push({ source: rootId, target: `ins_${ins.id}` });
        }
      });
    }

    return { nodes, links };
  }, [categories, subQuestions, investigations, insights, visibleLevels]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    const { nodes, links } = buildGraph();

    if (nodes.length === 0) return;

    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d) => {
            const src = d.source as GraphNode;
            const tgt = d.target as GraphNode;
            if (src.type === 'root') return 140;
            if (tgt.type === 'subQuestion') return 100;
            if (tgt.type === 'investigation') return 80;
            return 60;
          })
          .strength(0.8)
      )
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.r + 8));

    // Links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.2)
      .attr('stroke-opacity', 0.7);

    // Node groups
    const node = g
      .append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (_event, d) => {
        const label = d.label === 'שאלת המחקר' ? RESEARCH_QUESTION.text : d.label;
        const extra =
          d.type === 'root'
            ? RESEARCH_QUESTION.attribution
            : d.type === 'insight'
            ? insights.find((i) => i.id === d.entityId)?.text
            : d.type === 'investigation'
            ? investigations.find((i) => i.id === d.entityId)?.title
            : undefined;
        setSidebar({ type: d.type, label, extra, color: d.color });
      });

    // Circles
    node
      .append('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => {
        if (d.type === 'root') return '#1e293b';
        return d.color + (d.type === 'insight' ? '99' : 'cc');
      })
      .attr('stroke', (d) => (d.type === 'root' ? '#6366f1' : d.color))
      .attr('stroke-width', (d) => (d.type === 'root' ? 3 : 1.5));

    // Labels — only for larger nodes
    node
      .filter((d) => d.type !== 'insight')
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', (d) => (d.type === 'root' ? '#fff' : '#1e293b'))
      .attr('font-size', (d) => {
        if (d.type === 'root') return '10px';
        if (d.type === 'category') return '9px';
        return '8px';
      })
      .attr('font-family', 'Heebo, Arial Hebrew, sans-serif')
      .attr('pointer-events', 'none')
      .each(function (d) {
        const el = d3.select(this);
        const words = d.label.split(' ');
        if (words.length > 3 && d.r < 20) {
          const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
          const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
          el.text('');
          el.append('tspan').attr('x', 0).attr('dy', '-0.5em').text(line1);
          el.append('tspan').attr('x', 0).attr('dy', '1.1em').text(line2);
        }
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [buildGraph, categories, subQuestions, investigations, insights]);

  const toggleLevel = (type: NodeType) => {
    setVisibleLevels((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const LEVEL_LABELS: [NodeType, string][] = [
    ['category', 'קטגוריות'],
    ['subQuestion', 'שאלות משנה'],
    ['investigation', 'חקירות'],
    ['insight', 'תובנות'],
  ];

  const totalNodes =
    (visibleLevels.category ? categories.length : 0) +
    (visibleLevels.subQuestion ? subQuestions.length : 0) +
    (visibleLevels.investigation ? investigations.length : 0) +
    (visibleLevels.insight ? Math.min(insights.length, 200) : 0) +
    1;

  return (
    <div className="flex h-full" dir="rtl">
      {/* Controls panel */}
      <div className="w-52 bg-white border-l border-slate-200 flex-shrink-0 flex flex-col p-4 gap-4 z-10 overflow-y-auto">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 mb-2">מפת מחקר</h2>
          <p className="text-xs text-slate-500">{totalNodes} צמתים מוצגים</p>
        </div>

        {/* Level toggles */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-600 mb-1">הצג שכבות</p>
          {LEVEL_LABELS.map(([type, label]) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleLevels[type]}
                onChange={() => toggleLevel(type)}
                className="rounded"
              />
              <span className="text-xs text-slate-700">{label}</span>
            </label>
          ))}
        </div>

        {/* Category legend */}
        {categories.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-600 mb-1">קטגוריות</p>
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-slate-700 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Node size legend */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-600 mb-1">גודל צמתים</p>
          {([
            ['root', 'שאלת מחקר'],
            ['category', 'קטגוריה'],
            ['subQuestion', 'שאלת משנה'],
            ['investigation', 'חקירה'],
            ['insight', 'תובנה'],
          ] as [NodeType, string][]).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="rounded-full bg-slate-400 flex-shrink-0"
                style={{ width: NODE_RADIUS[type] * 0.7, height: NODE_RADIUS[type] * 0.7 }}
              />
              <span className="text-xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">גלגל עכבר לזום, גרור לסובב</p>
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} className="flex-1 relative bg-slate-50 overflow-hidden">
        {categories.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            הוסף קטגוריות ושאלות כדי לראות את מפת המחקר
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full" />

        {/* Sidebar overlay on node click */}
        {sidebar && (
          <div className="absolute top-4 left-4 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
            <div className="flex items-start gap-2 mb-3">
              <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: sidebar.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  {sidebar.type === 'root' ? 'שאלת מחקר' :
                   sidebar.type === 'category' ? 'קטגוריה' :
                   sidebar.type === 'subQuestion' ? 'שאלת משנה' :
                   sidebar.type === 'investigation' ? 'חקירה' : 'תובנה'}
                </p>
                <p className="text-sm text-slate-800 leading-relaxed">{sidebar.label}</p>
                {sidebar.extra && sidebar.extra !== sidebar.label && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{sidebar.extra}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSidebar(null)}
                className="text-slate-400 hover:text-slate-700 flex-shrink-0 text-lg leading-none"
              >×</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
