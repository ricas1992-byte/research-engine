import type { Source } from '../types/insight';
import { AxisBadge } from './AxisBadge';
import { STANCE_LABELS } from '../utils/colors';

interface Props {
  source: Source;
  connectionCount?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STANCE_STYLE: Record<string, string> = {
  'establishment': 'bg-red-100 text-red-700 border-red-200',
  'peripheral':    'bg-emerald-100 text-emerald-700 border-emerald-200',
  'neutral':       'bg-gray-100 text-gray-600 border-gray-200',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  'research':      'מחקר',
  'book':          'ספר',
  'quote':         'ציטוט',
  'institutional': 'מסמך מוסדי',
  'personal':      'אישי',
};

export function SourceCard({ source, connectionCount, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STANCE_STYLE[source.stance]}`}
          >
            {STANCE_LABELS[source.stance]}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {SOURCE_TYPE_LABELS[source.type]}
          </span>
          {connectionCount !== undefined && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {connectionCount} קשרים
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(source.id)} className="text-xs text-blue-500 hover:text-blue-700">
              עריכה
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(source.id)} className="text-xs text-gray-400 hover:text-red-500">
              ✕
            </button>
          )}
        </div>
      </div>

      <p className="font-semibold text-gray-800">{source.title}</p>
      <p className="text-sm text-gray-500 mb-2">{source.author}</p>

      <p className="text-sm text-gray-700 leading-relaxed italic">"{source.content}"</p>

      {source.axes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {source.axes.map((axis) => (
            <AxisBadge key={axis} axis={axis} size="sm" />
          ))}
        </div>
      )}

      {source.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {source.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
