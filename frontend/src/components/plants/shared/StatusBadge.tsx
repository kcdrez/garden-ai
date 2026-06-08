import type { UserPlantStatus } from '@/types/plants';
import { STATUS_CLASSES, statusLabel } from '@/lib/plants';

type Props = {
  status: UserPlantStatus;
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[status]}`}>
      {statusLabel(status)}
    </span>
  );
}
