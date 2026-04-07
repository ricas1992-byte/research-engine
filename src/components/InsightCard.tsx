import { Link } from 'react-router-dom';
import type { Insight } from '../types/insight';
import { AxisBadge } from './AxisBadge';
import { StatusBadge } from './StatusBadge';

interface Props {
  insight: Insight;
  connectionCount?: number;
  compact?: boolean;
  onDelete?: (id: string) => void;
}

export function InsightCard({ insight, connectionCount, compact = false, onDelete }: Props) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow ${
        insight.blindSpotFlag ? 'border-amber-400 bg-amber-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <AxisBadge axis={insight.axis} size="sm" />
          <StatusBadge status={insight.status} size="sm" />
          <span className="text-xs text-gray-400">סבב {insight.round}</span>
          {insight.blindSpotFlag && (
            <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
              ⚠ עיוורון
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {connectionCount !== undefined && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {connectionCount} קשרים
            </span>
          )}
          <Link
            to={`/editor/${insight.id}`}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            עריכה
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(insight.id)}
              className="text-xs text-gray-400 hover:text-red-500"
              aria-label="מחק תובנה"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <p className={`text-gray-800 leading-relaxed ${compact ? 'text-sm line-clamp-2' : ''}`}>
        {insight.content}
      </p>

      {!compact && insight.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {insight.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {!compact && insight.zachariasQuestion && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          <p className="text-xs text-amber-700 italic">{insight.zachariasQuestion}</p>
        </div>
      )}
    </div>
  );
}
