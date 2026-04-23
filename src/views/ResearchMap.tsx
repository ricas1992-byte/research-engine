import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useStore } from '../data/store';
import { useProjectStore } from '../data/projectStore';

type NodeType = 'root' | 'category' | 'subCategory' | 'subQuestion' | 'investigation' | 'insight';

interface TreeData {
  id: string;
  type: NodeType;
  label: string;
  fullLabel: string;
  color: string;
  entityId: string;
  children?: TreeData[];
}

interface SidebarItem {
  type: NodeType;
  label: string;
  extra?: string;
  color: string;
}

const TYPE_LABEL: Record<NodeType, string> = {
  root: 'שאלת מחקר',
  category: 'קטגוריה',
  subCategory: 'תת-קטגוריה',
  subQuestion: 'שאלת משנה',
  investigation: 'חקירה',
  insight: 'תובנה',
};

interface VisibleLevels {
  category: boolean;
  subCategory: boolean;
  subQuestion: boolean;
  investigation: boolean;
  insight: boolean;
}

const LEVEL_LABELS: [keyof VisibleLevels, string][] = [
  ['category', 'קטגוריות'],
  ['subCategory', 'תת-קטגוריות'],
  ['subQuestion', 'שאלות משנה'],
  ['investigation', 'חקירות'],
  ['insight', 'תובנות'],
];

type PNode = d3.HierarchyPointNode<TreeData>;

function trunc(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

// Blend category color toward white at the given ratio (0=original, 1=white)
function lightenHex(hex: string, ratio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * ratio);
  const lg = Math.round(g + (255 - g) * ratio);
  const lb = Math.round(b + (255 - b) * ratio);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

export function ResearchMap() {
  const { categories, subCategories, subQuestions, investigations, insights,
    getSubCategoriesByCategory, getSubQuestionsBySubCategory, getDirectSubQuestionsByCategory,
  } = useStore();
  const activeProject = useProjectStore((s) => s.getActiveProject());
  const researchQuestionText = activeProject?.researchQuestion ?? 'שאלת המחקר';

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebar, setSidebar] = useState<SidebarItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [visibleLevels, setVisibleLevels] = useState<VisibleLevels>({
    category: true,
    subCategory: true,
    subQuestion: true,
    investigation: true,
    insight: false,
  });

  const buildSubQChildren = useCallback((sq: typeof subQuestions[0], color: string): TreeData => {
    const invNodes: TreeData[] = visibleLevels.investigation
      ? investigations
          .filter((inv) => inv.subQuestionId === sq.id)
          .map((inv) => {
            const insNodes: TreeData[] = visibleLevels.insight
              ? insights
                  .filter((ins) => ins.investigationId === inv.id)
                  .slice(0, 12)
                  .map((ins) => ({
                    id: `ins_${ins.id}`,
                    type: 'insight' as NodeType,
                    label: trunc(ins.text, 18),
                    fullLabel: ins.text,
                    color,
                    entityId: ins.id,
                  }))
              : [];
            return {
              id: `inv_${inv.id}`,
              type: 'investigation' as NodeType,
              label: trunc(inv.title, 20),
              fullLabel: inv.title,
              color,
              entityId: inv.id,
              ...(insNodes.length > 0 ? { children: insNodes } : {}),
            };
          })
      : [];
    const sqLabel = sq.number ? `${sq.number} ${trunc(sq.text, 16)}` : trunc(sq.text, 22);
    return {
      id: `sq_${sq.id}`,
      type: 'subQuestion' as NodeType,
      label: sqLabel,
      fullLabel: sq.number ? `${sq.number} — ${sq.text}` : sq.text,
      color,
      entityId: sq.id,
      ...(invNodes.length > 0 ? { children: invNodes } : {}),
    };
  }, [investigations, insights, visibleLevels]);

  const buildHierarchy = useCallback((): TreeData => {
    const catNodes: TreeData[] = categories.map((cat) => {
      if (!visibleLevels.category) return null as unknown as TreeData;

      const catSubCats = getSubCategoriesByCategory(cat.id);
      const children: TreeData[] = [];

      if (visibleLevels.subQuestion) {
        // SubCategory nodes (if visible)
        if (visibleLevels.subCategory && catSubCats.length > 0) {
          for (const sc of catSubCats) {
            const scSQs = getSubQuestionsBySubCategory(sc.id);
            const scChildren = scSQs.map((sq) => buildSubQChildren(sq, cat.color));
            const scColor = lightenHex(cat.color, 0.45);
            children.push({
              id: `sc_${sc.id}`,
              type: 'subCategory' as NodeType,
              label: trunc(sc.name, 16),
              fullLabel: sc.name,
              color: scColor,
              entityId: sc.id,
              ...(scChildren.length > 0 ? { children: scChildren } : {}),
            });
          }
        } else if (!visibleLevels.subCategory && catSubCats.length > 0) {
          // SubCategories hidden — flatten their SQs directly under category
          for (const sc of catSubCats) {
            const scSQs = getSubQuestionsBySubCategory(sc.id);
            scSQs.forEach((sq) => children.push(buildSubQChildren(sq, cat.color)));
          }
        }

        // Direct sub-questions (no subCategory)
        const directSQs = getDirectSubQuestionsByCategory(cat.id);
        directSQs.forEach((sq) => children.push(buildSubQChildren(sq, cat.color)));
      }

      return {
        id: `cat_${cat.id}`,
        type: 'category' as NodeType,
        label: trunc(cat.name, 16),
        fullLabel: cat.name,
        color: cat.color,
        entityId: cat.id,
        ...(children.length > 0 ? { children } : {}),
      };
    }).filter(Boolean);

    return {
      id: '__root__',
      type: 'root',
      label: 'שאלת\nהמחקר',
      fullLabel: researchQuestionText,
      color: '#1e293b',
      entityId: '__root__',
      ...(catNodes.length > 0 ? { children: catNodes } : {}),
    };
  }, [
    categories, visibleLevels,
    getSubCategoriesByCategory, getSubQuestionsBySubCategory, getDirectSubQuestionsByCategory,
    buildSubQChildren, researchQuestionText,
  ]);

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

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.04, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const data = buildHierarchy();
    const root = d3.hierarchy(data);

    if (!root.children || root.children.length === 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '14px')
        .attr('font-family', 'Heebo, Arial Hebrew, sans-serif')
        .text('הוסף קטגוריות ושאלות כדי לראות את מפת המחקר');
      return;
    }

    // Static hierarchical tree layout
    const treeLayout = d3.tree<TreeData>().nodeSize([56, 210]);
    treeLayout(root);

    // Compute tree bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    root.each((n) => {
      const pn = n as PNode;
      if (pn.x < minX) minX = pn.x;
      if (pn.x > maxX) maxX = pn.x;
      if (pn.y < minY) minY = pn.y;
      if (pn.y > maxY) maxY = pn.y;
    });

    // RTL: root on right, leaves grow left
    const cx = width / 2 + (maxY - minY) / 2;
    const cy = height / 2 - (minX + maxX) / 2;

    const sx = (n: PNode) => cx - n.y;
    const sy = (n: PNode) => cy + n.x;

    // Auto-fit initial zoom
    const treeW = maxY - minY + 240;
    const treeH = maxX - minX + 120;
    const scale = Math.min((width - 80) / treeW, (height - 80) / treeH, 0.95);
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-width / 2, -height / 2)
    );

    // ─── Links ───────────────────────────────────────────────
    g.append('g')
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.65)
      .attr('d', (link) => {
        const s = link.source as PNode;
        const t = link.target as PNode;
        const x1 = sx(s), y1 = sy(s);
        const x2 = sx(t), y2 = sy(t);
        const mx = (x1 + x2) / 2;
        return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      });

    // ─── Nodes ───────────────────────────────────────────────
    const nodes = g
      .append('g')
      .selectAll<SVGGElement, PNode>('g')
      .data(root.descendants() as PNode[])
      .join('g')
      .attr('transform', (d) => `translate(${sx(d)},${sy(d)})`)
      .attr('cursor', 'pointer')
      .on('click', (_e, d) => {
        setSidebar({
          type: d.data.type,
          label: d.data.type === 'root' ? researchQuestionText : d.data.fullLabel,
          extra: undefined,
          color: d.data.color,
        });
      });

    // Root – large dark circle
    const rootNodes = nodes.filter((d) => d.data.type === 'root');
    rootNodes
      .append('circle')
      .attr('r', 40)
      .attr('fill', '#1e293b')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 3);
    rootNodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-family', 'Heebo, Arial Hebrew, sans-serif')
      .attr('pointer-events', 'none')
      .call((t) => {
        t.append('tspan').attr('x', 0).attr('dy', '-0.6em').text('שאלת');
        t.append('tspan').attr('x', 0).attr('dy', '1.3em').text('המחקר');
      });

    // Category – colored circle
    const catNodes = nodes.filter((d) => d.data.type === 'category');
    catNodes
      .append('circle')
      .attr('r', 28)
      .attr('fill', (d) => d.data.color + 'cc')
      .attr('stroke', (d) => d.data.color)
      .attr('stroke-width', 2.5);
    catNodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('font-family', 'Heebo, Arial Hebrew, sans-serif')
      .attr('pointer-events', 'none')
      .text((d) => d.data.label);

    // SubCategory – smaller circle, lightened color, dashed border
    const scNodes = nodes.filter((d) => d.data.type === 'subCategory');
    scNodes
      .append('circle')
      .attr('r', 18)
      .attr('fill', (d) => d.data.color + 'aa')
      .attr('stroke', (d) => d.data.color)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 2');
    scNodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#374151')
      .attr('font-size', '8px')
      .attr('font-weight', '600')
      .attr('font-family', 'Heebo, Arial Hebrew, sans-serif')
      .attr('pointer-events', 'none')
      .text((d) => d.data.label);

    // SubQuestion – diamond (rotated square)
    const sqNodes = nodes.filter((d) => d.data.type === 'subQuestion');
    sqNodes
      .append('polygon')
      .attr('points', '0,-24 26,0 0,24 -26,0')
      .attr('fill', (d) => d.data.color + '28')
      .attr('stroke', (d) => d.data.color)
      .attr('stroke-width', 1.8);
    sqNodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 35)
      .attr('fill', '#374151')
      .attr('font-size', '8px')
      .attr('font-family', 'Heebo, Arial Hebrew, sans-serif')
      .attr('pointer-events', 'none')
      .text((d) => d.data.label);

    // Investigation – rounded rectangle (card)
    const invNodes = nodes.filter((d) => d.data.type === 'investigation');
    invNodes
      .append('rect')
      .attr('x', -48)
      .attr('y', -15)
      .attr('width', 96)
      .attr('height', 30)
      .attr('rx', 6)
      .attr('fill', (d) => d.data.color + '20')
      .attr('stroke', (d) => d.data.color)
      .attr('stroke-width', 1.5);
    invNodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#1e293b')
      .attr('font-size', '8px')
      .attr('font-family', 'Heebo, Arial Hebrew, sans-serif')
      .attr('pointer-events', 'none')
      .text((d) => d.data.label);

    // Insight – small pill
    const insNodes = nodes.filter((d) => d.data.type === 'insight');
    insNodes
      .append('rect')
      .attr('x', -20)
      .attr('y', -8)
      .attr('width', 40)
      .attr('height', 16)
      .attr('rx', 8)
      .attr('fill', (d) => d.data.color + '28')
      .attr('stroke', (d) => d.data.color + '99')
      .attr('stroke-width', 1);
    insNodes
      .append('title')
      .text((d) => d.data.fullLabel);

  }, [buildHierarchy, researchQuestionText]);

  const toggleLevel = (level: keyof VisibleLevels) => {
    setVisibleLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  const totalNodes =
    (visibleLevels.category ? categories.length : 0) +
    (visibleLevels.subCategory ? subCategories.length : 0) +
    (visibleLevels.subQuestion ? subQuestions.length : 0) +
    (visibleLevels.investigation ? investigations.length : 0) +
    (visibleLevels.insight ? Math.min(insights.length, 200) : 0) +
    1;

  return (
    <div className="flex h-full relative" dir="rtl">
      {/* ─── Controls panel ─────────────────────────────────── */}
      {panelOpen && (
        <div className="w-52 bg-white border-l border-slate-200 flex-shrink-0 flex flex-col p-4 gap-5 z-10 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">מפת מחקר</h2>
              <p className="text-xs text-slate-400 mt-0.5">{totalNodes} צמתים</p>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xl leading-none"
              title="סגור"
            >
              ×
            </button>
          </div>

          {/* Shape legend */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">מקרא צורות</p>
            {[
              {
                label: 'שאלת מחקר',
                shape: (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="8" fill="#1e293b" stroke="#6366f1" strokeWidth="2" />
                  </svg>
                ),
              },
              {
                label: 'קטגוריה',
                shape: (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="8" fill="#6366f1cc" stroke="#6366f1" strokeWidth="2" />
                  </svg>
                ),
              },
              {
                label: 'תת-קטגוריה',
                shape: (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="7" fill="#a5b4fcaa" stroke="#a5b4fc" strokeWidth="1.5" strokeDasharray="4 2" />
                  </svg>
                ),
              },
              {
                label: 'שאלת משנה',
                shape: (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <polygon points="9,1 17,9 9,17 1,9" fill="#6366f128" stroke="#6366f1" strokeWidth="1.5" />
                  </svg>
                ),
              },
              {
                label: 'חקירה',
                shape: (
                  <svg width="18" height="12" viewBox="0 0 18 12">
                    <rect x="1" y="1" width="16" height="10" rx="3" fill="#6366f120" stroke="#6366f1" strokeWidth="1.5" />
                  </svg>
                ),
              },
              {
                label: 'תובנה',
                shape: (
                  <svg width="18" height="12" viewBox="0 0 18 12">
                    <rect x="1" y="2" width="16" height="8" rx="4" fill="#6366f128" stroke="#6366f199" strokeWidth="1" />
                  </svg>
                ),
              },
            ].map(({ label, shape }) => (
              <div key={label} className="flex items-center gap-2.5 min-h-[28px]">
                <div className="flex-shrink-0 flex items-center justify-center w-5">{shape}</div>
                <span className="text-xs text-slate-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Layer toggles */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 mb-2">שכבות</p>
            {LEVEL_LABELS.map(([type, label]) => (
              <label key={type} className="flex items-center gap-2.5 cursor-pointer min-h-[40px]">
                <input
                  type="checkbox"
                  checked={visibleLevels[type]}
                  onChange={() => toggleLevel(type)}
                  className="rounded w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          {/* Category legend */}
          {categories.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 mb-2">קטגוריות</p>
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2.5 min-h-[28px]">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs text-slate-700 truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-auto pt-2">גלגלת לזום · גרור לניווט</p>
        </div>
      )}

      {/* Open panel button */}
      {!panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 hover:bg-slate-50 flex items-center justify-center text-lg"
          title="פתח פאנל"
        >
          ☰
        </button>
      )}

      {/* ─── Graph canvas ────────────────────────────────────── */}
      <div ref={containerRef} className="flex-1 relative bg-slate-50 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />

        {/* Node info overlay */}
        {sidebar && (
          <div className="absolute top-4 left-4 w-80 max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg border border-slate-200 p-5">
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: sidebar.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  {TYPE_LABEL[sidebar.type]}
                </p>
                <p className="text-sm text-slate-800 leading-relaxed">{sidebar.label}</p>
                {sidebar.extra && sidebar.extra !== sidebar.label && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{sidebar.extra}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSidebar(null)}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex-shrink-0 text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
