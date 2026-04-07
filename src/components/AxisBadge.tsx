import type { Axis } from '../types/insight';
import { AXIS_COLORS } from '../utils/colors';

interface Props {
  axis: Axis;
  size?: 'sm' | 'md';
}

export function AxisBadge({ axis, size = 'md' }: Props) {
  const colors = AXIS_COLORS[axis];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${colors.bg} ${colors.text} ${colors.border} ${sizeClass}`}
    >
      {axis}
    </span>
  );
}
