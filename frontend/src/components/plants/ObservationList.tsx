import {
  BugIcon,
  CloudIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  CircleIcon,
  ShoppingBasketIcon,
  Trash2Icon,
  ArrowRightIcon,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteObservation } from '@/api/plants';
import {
  OBSERVATION_TYPES,
  USER_PLANT_STATUSES,
  type Observation,
  type ObservationType,
} from '@/types/plants';
import { formatObservationDate } from '@/lib/dates';
import { QueryState } from '@/components/ui/query-state';

const OBSERVATION_ICONS: Record<ObservationType, React.ComponentType<{ className?: string }>> = {
  status_change: CircleIcon,
  transplant: ArrowRightIcon,
  harvest: ShoppingBasketIcon,
  pest: BugIcon,
  weather: CloudIcon,
  disease: AlertTriangleIcon,
  general: MessageSquareIcon,
};

function observationHeading(obs: Observation): string {
  if (obs.type === 'status_change') {
    const label = USER_PLANT_STATUSES.find((s) => s.value === obs.newStatus)?.label ?? obs.newStatus;
    return `Moved to ${label}`;
  }
  return OBSERVATION_TYPES.find((t) => t.value === obs.type)?.label ?? obs.type;
}

type Props = {
  gardenId: string;
  bedId: string;
  plantId: string;
  observations: Observation[];
  isLoading: boolean;
  error: Error | null;
};

export default function ObservationList({
  gardenId,
  bedId,
  plantId,
  observations,
  isLoading,
  error,
}: Props) {
  const queryClient = useQueryClient();

  const removeObservation = useMutation({
    mutationFn: (obsId: string) => deleteObservation(gardenId, bedId, plantId, obsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations', plantId] });
    },
  });

  return (
    <div>
      <p className="text-xs text-muted-foreground pb-2">History</p>
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={observations.length === 0}
        emptyMessage="No history yet."
      >
        <ul className="space-y-2">
          {observations.map((obs, i) => {
            const Icon = OBSERVATION_ICONS[obs.type];
            return (
              <li
                key={obs.id}
                className={`flex items-start gap-2 text-sm group rounded px-2 py-1 ${i % 2 === 0 ? 'bg-muted/50' : ''}`}
              >
                <Icon className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{observationHeading(obs)}</span>
                  {obs.note && (
                    <p className="text-muted-foreground text-xs mt-0.5">{obs.note}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatObservationDate(obs.observedDate)}
                  </p>
                </div>
                <button
                  onClick={() => removeObservation.mutate(obs.id)}
                  disabled={removeObservation.isPending}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity self-center"
                  aria-label="Delete observation"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </QueryState>
    </div>
  );
}
