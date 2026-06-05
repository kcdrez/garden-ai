import {
  BugIcon,
  CloudIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  CircleIcon,
  ShoppingBasketIcon,
  Trash2Icon,
  ArrowRightIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteObservation, updateObservation } from '@/api/plants';
import { observationEditSchema, type ObservationEditFormValues } from '@/schemas/plants';
import {
  OBSERVATION_TYPES,
  USER_PLANT_STATUSES,
  type Observation,
  type ObservationType,
} from '@/types/plants';
import { formatObservationDate } from '@/lib/dates';
import { QueryState } from '@/components/ui/query-state';
import { Form } from '@/components/ui/form';
import { TextField, TextAreaField } from '@/components/ui/form-fields';

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

type EditRowProps = {
  obs: Observation;
  gardenId: string;
  bedId: string;
  plantId: string;
  onDone: () => void;
};

function ObservationEditRow({ obs, gardenId, bedId, plantId, onDone }: EditRowProps) {
  const queryClient = useQueryClient();

  const form = useForm<ObservationEditFormValues>({
    resolver: zodResolver(observationEditSchema),
    defaultValues: { observedDate: obs.observedDate, note: obs.note ?? '' },
    mode: 'onChange',
  });

  const save = useMutation({
    mutationFn: (values: ObservationEditFormValues) =>
      updateObservation(gardenId, bedId, plantId, obs.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations', plantId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      onDone();
    },
  });

  return (
    <Form form={form} onSubmit={(v) => save.mutate(v)} className="flex-1 min-w-0">
      <div className="flex items-start gap-2">
        <div className="w-32 shrink-0">
          <TextField control={form.control} name="observedDate" label="Date" type="date" />
        </div>
        <div className="flex-1 min-w-0">
          <TextAreaField control={form.control} name="note" label="Note" rows={1} className="min-h-0 h-8 py-1" />
        </div>
        <div className="flex gap-1 shrink-0 self-center">
          <button
            type="submit"
            disabled={!form.formState.isValid || save.isPending}
            className="text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            aria-label="Save"
          >
            <CheckIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDone}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cancel"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </Form>
  );
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const removeObservation = useMutation({
    mutationFn: (obsId: string) => deleteObservation(gardenId, bedId, plantId, obsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations', plantId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
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
            const isEditing = editingId === obs.id;
            return (
              <li
                key={obs.id}
                className={`flex items-center gap-2 text-sm group rounded px-2 py-1 ${i % 2 === 0 ? 'bg-muted/50' : ''}`}
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                {isEditing ? (
                  <ObservationEditRow
                    obs={obs}
                    gardenId={gardenId}
                    bedId={bedId}
                    plantId={plantId}
                    onDone={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{observationHeading(obs)}</span>
                      {obs.note && (
                        <p className="text-muted-foreground text-xs mt-0.5">{obs.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatObservationDate(obs.observedDate)}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(obs.id)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Edit observation"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                      <button
                        onClick={() => removeObservation.mutate(obs.id)}
                        disabled={removeObservation.isPending}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete observation"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </QueryState>
    </div>
  );
}
