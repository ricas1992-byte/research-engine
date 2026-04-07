import type { CrossReference } from '../types/insight';
import type { Insight, Source } from '../types/insight';
import { CROSSREF_COLORS, CROSSREF_LABELS } from '../utils/colors';
import { ConfidenceBar } from './ConfidenceBar';

interface Props {
  ref_: CrossReference;
  insights: Insight[];
  sources: Source[];
  onDelete?: (id: string) => void;
}

export function CrossRefCard({ ref_, insights, sources, onDelete }: Props) {
  const color = CROSSREF_COLORS[ref_.type];

  const targetLabel =
    ref_.targetKind === 'insight'
      ? insights.find((i) => i.id === ref_.targetId)?.content?.slice(0, 60) + '...'
      : (() => {
          const src = sources.find((s) => s.id === ref_.targetId);
          return src ? `${src.author}: ${src.title}` : ref_.targetId;
        })();

  return (
    <div className="border rounded-lg p-3 bg-white space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {CROSSREF_LABELS[ref_.type]}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {ref_.discoveredBy === 'engine' ? 'מנוע' : 'ידני'}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(ref_.id)}
              className="text-gray-400 hover:text-red-500 text-xs"
              aria-label="מחק הצלבה"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed">{ref_.explanation}</p>

      {targetLabel && (
        <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
          ← <span className="font-medium">{ref_.targetKind === 'insight' ? 'תובנה' : 'מקור'}:</span>{' '}
          {targetLabel}
        </p>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
        <p className="text-xs text-amber-800 font-medium">שאלת זכריה:</p>
        <p className="text-xs text-amber-700 mt-0.5 italic">{ref_.zachpiracyQuestion}</p>
      </div>

      <ConfidenceBar confidence={ref_.confidence} />
    </div>
  );
}
