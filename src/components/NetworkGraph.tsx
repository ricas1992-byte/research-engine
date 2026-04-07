import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { Insight, Source, CrossReference } from '../types/insight';
import { AXIS_COLORS, CROSSREF_COLORS } from '../utils/colors';

export interface GraphNode {
  id: string;
  label: string;
  kind: 'insight' | 'source';
  axis?: string;
  connections: number;
  data: Insight | Source;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: CrossReference['type'];
  confidence: number;
  explanation: string;
  zachpiracyQuestion: string;
  id: string;
}

interface Props {
  insights: Insight[];
  sources: Source[];
  crossRefs: CrossReference[];
  onNodeClick?: (node: GraphNode) => void;
  onLinkClick?: (link: GraphLink) => void;
  filterAxis?: string;
  filterRound?: number;
  filterRefType?: string;
}

export function NetworkGraph({
  insights,
  sources,
  crossRefs,
  onNodeClick,
  onLinkClick,
  filterAxis,
  filterRound,
  filterRefType,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredInsights = useMemo(
    () => insights.filter((ins) => {
      if (filterAxis && ins.axis !== filterAxis) return false;
      if (filterRound && ins.round !== filterRound) return false;
      return true;
    }),
    [insights, filterAxis, filterRound]
  );

  const filteredRefs = useMemo(() => {
    const insightIds = new Set(filteredInsights.map((i) => i.id));
    return crossRefs.filter((ref) => {
      if (filterRefType && ref.type !== filterRefType) return false;
      return insightIds.has(ref.insightId);
    });
  }, [crossRefs, filteredInsights, filterRefType]);

  const filteredSources = useMemo(() => {
    const referencedSourceIds = new Set(
      filteredRefs.filter((r) => r.targetKind === 'source').map((r) => r.targetId)
    );
    return sources.filter((s) => referencedSourceIds.has(s.id));
  }, [sources, filteredRefs]);

  const nodes: GraphNode[] = useMemo(() => {
    const connectionCount: Record<string, number> = {};
    filteredRefs.forEach((ref) => {
      connectionCount[ref.insightId] = (connectionCount[ref.insightId] ?? 0) + 1;
      connectionCount[ref.targetId] = (connectionCount[ref.targetId] ?? 0) + 1;
    });
    return [
      ...filteredInsights.map((ins) => ({
        id: ins.id,
        label: ins.content.slice(0, 40) + (ins.content.length > 40 ? '...' : ''),
        kind: 'insight' as const,
        axis: ins.axis,
        connections: connectionCount[ins.id] ?? 0,
        data: ins,
      })),
      ...filteredSources.map((src) => ({
        id: src.id,
        label: `${src.author}: ${src.title}`.slice(0, 40),
        kind: 'source' as const,
        axis: src.axes[0],
        connections: connectionCount[src.id] ?? 0,
        data: src,
      })),
    ];
  }, [filteredInsights, filteredSources, filteredRefs]);

  const links: GraphLink[] = useMemo(() => {
    const nodeIds = new Set(nodes.map((n) => n.id));
    return filteredRefs
      .filter((ref) => nodeIds.has(ref.insightId) && nodeIds.has(ref.targetId))
      .map((ref) => ({
        source: ref.insightId,
        target: ref.targetId,
        type: ref.type,
        confidence: ref.confidence,
        explanation: ref.explanation,
        zachpiracyQuestion: ref.zachpiracyQuestion,
        id: ref.id,
      }));
  }, [filteredRefs, nodes]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(500, entry.contentRect.height),
        });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });
    svg.call(zoom);

    // Arrow markers for directed edges
    const defs = svg.append('defs');
    Object.entries(CROSSREF_COLORS).forEach(([type, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => nodeRadius(d as GraphNode) + 10));

    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => CROSSREF_COLORS[d.type] ?? '#999')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', (d) => 1 + d.confidence * 3)
      .attr('marker-end', (d) => `url(#arrow-${d.type})`)
      .style('cursor', 'pointer')
      .on('click', (_, d) => onLinkClick?.(d));

    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
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
      .on('click', (_, d) => onNodeClick?.(d));

    // Draw shapes: circle for insights, square for sources
    node.each(function (d) {
      const el = d3.select(this);
      const r = nodeRadius(d);
      const color = d.axis ? (AXIS_COLORS[d.axis as keyof typeof AXIS_COLORS]?.graph ?? '#94a3b8') : '#94a3b8';
      const isIsolated = d.connections === 0;

      if (d.kind === 'insight') {
        el.append('circle')
          .attr('r', r)
          .attr('fill', color)
          .attr('fill-opacity', isIsolated ? 0.3 : 0.85)
          .attr('stroke', isIsolated ? '#f59e0b' : 'white')
          .attr('stroke-width', isIsolated ? 2.5 : 1.5)
          .attr('stroke-dasharray', isIsolated ? '4,2' : 'none');
      } else {
        el.append('rect')
          .attr('x', -r)
          .attr('y', -r)
          .attr('width', r * 2)
          .attr('height', r * 2)
          .attr('rx', 3)
          .attr('fill', color)
          .attr('fill-opacity', 0.85)
          .attr('stroke', 'white')
          .attr('stroke-width', 1.5);
      }
    });

    // Labels
    node.append('text')
      .text((d) => d.label.slice(0, 20))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => nodeRadius(d) + 14)
      .attr('font-size', '10px')
      .attr('fill', '#374151')
      .attr('font-family', 'David Libre, serif');

    // Hover effects
    node
      .on('mouseover', function (_, hovered) {
        const connectedIds = new Set<string>();
        links.forEach((l) => {
          const src = (l.source as GraphNode).id ?? l.source;
          const tgt = (l.target as GraphNode).id ?? l.target;
          if (src === hovered.id || tgt === hovered.id) {
            connectedIds.add(src as string);
            connectedIds.add(tgt as string);
          }
        });
        node.style('opacity', (d) => connectedIds.has(d.id) || d.id === hovered.id ? 1 : 0.2);
        link.style('opacity', (l) => {
          const s = (l.source as GraphNode).id ?? l.source;
          const t = (l.target as GraphNode).id ?? l.target;
          return s === hovered.id || t === hovered.id ? 1 : 0.1;
        });
      })
      .on('mouseout', function () {
        node.style('opacity', 1);
        link.style('opacity', 0.7);
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);
      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => simulation.stop();
  }, [nodes.length, links.length, dimensions, filterAxis, filterRound, filterRefType]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-gray-50 rounded-xl overflow-hidden">
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400 text-lg">
          אין נתונים להצגה
        </div>
      ) : (
        <svg ref={svgRef} className="w-full h-full" />
      )}
    </div>
  );
}

function nodeRadius(d: GraphNode): number {
  return Math.max(10, Math.min(30, 10 + d.connections * 3));
}
