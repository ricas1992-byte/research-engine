interface Props {
  confidence: number; // 0–1
  showLabel?: boolean;
}

export function ConfidenceBar({ confidence, showLabel = true }: Props) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 w-8 text-left">{pct}%</span>
      )}
    </div>
  );
}
