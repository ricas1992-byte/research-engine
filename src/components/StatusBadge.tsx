import type { Status } from '../types/insight';
import { STATUS_COLORS } from '../utils/colors';

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

const STATUS_ICONS: Record<Status, string> = {
  'גולמי': '○',
  'מעובד': '◑',
  'מוכן':  '●',
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const colors = STATUS_COLORS[status];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClass}`}
    >
      <span>{STATUS_ICONS[status]}</span>
      {status}
    </span>
  );
}
