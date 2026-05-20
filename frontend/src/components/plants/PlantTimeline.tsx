import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BugIcon,
  CloudIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  CircleIcon,
  ShoppingBasketIcon,
  Trash2Icon,
  PlusIcon,
} from 'lucide-react';
import {
  fetchObservations,
  createObservation,
  deleteObservation,
  updateUserPlant,
} from '@/api/plants';
import { observationSchema, type ObservationFormValues } from '@/schemas/plants';
import {
  OBSERVATION_TYPES,
  USER_PLANT_STATUSES,
  type Observation,
  type ObservationType,
  type UserPlant,
  type UserPlantStatus,
} from '@/types/plants';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';
import { QueryState } from '@/components/ui/query-state';

const STATUS_CLASSES: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  planted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  growing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  fruiting: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  dormant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  removed: 'bg-muted text-muted-foreground',
};

const OBSERVATION_ICONS: Record<ObservationType, React.ComponentType<{ className?: string }>> = {
  status_change: CircleIcon,
  harvest: ShoppingBasketIcon,
  pest: BugIcon,
  weather: CloudIcon,
  disease: AlertTriangleIcon,
  general: MessageSquareIcon,
};

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatObservationDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
  plant: UserPlant;
};

export default function PlantTimeline({ gardenId, bedId, plant }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const today = todayString();

  const { data: observations = [], isLoading, error } = useQuery({
    queryKey: ['observations', plant.id],
    queryFn: () => fetchObservations(gardenId, bedId, plant.id),
  });

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
    defaultValues: { type: 'general', observedDate: today, note: '', newStatus: 'planned' },
    mode: 'onChange',
  });

  const selectedType = form.watch('type');

  const addObservation = useMutation({
    mutationFn: (values: ObservationFormValues) =>
      createObservation(gardenId, bedId, plant.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations', plant.id] });
      form.reset({ type: 'general', observedDate: today, note: '', newStatus: 'planned' });
      setShowForm(false);
    },
  });

  const removeObservation = useMutation({
    mutationFn: (obsId: string) => deleteObservation(gardenId, bedId, plant.id, obsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations', plant.id] });
    },
  });

  const changeStatus = useMutation({
    mutationFn: (status: UserPlantStatus) =>
      updateUserPlant(gardenId, bedId, plant.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['observations', plant.id] });
    },
  });

  return (
    <div className="mt-2 ml-5 pl-4 border-l border-border space-y-4 pb-2">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {USER_PLANT_STATUSES.map((s) => {
            const isActive = plant.status === s.value;
            return (
              <button
                key={s.value}
                onClick={() => !isActive && changeStatus.mutate(s.value)}
                disabled={isActive || changeStatus.isPending}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-opacity ${STATUS_CLASSES[s.value] ?? 'bg-muted text-muted-foreground'} ${isActive ? 'ring-2 ring-ring ring-offset-1' : 'opacity-60 hover:opacity-100 cursor-pointer'} disabled:cursor-default`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">History</p>
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
                <li key={obs.id} className={`flex items-start gap-2 text-sm group rounded px-2 py-1 ${i % 2 === 0 ? 'bg-muted/50' : ''}`}>
                  <Icon className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{observationHeading(obs)}</span>
                    {obs.note && (
                      <p className="text-muted-foreground text-xs mt-0.5">{obs.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatObservationDate(obs.observedDate)}</p>
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

      {showForm ? (
        <Form form={form} onSubmit={(v) => addObservation.mutate(v)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <NativeSelectField control={form.control} name="type" label="Type">
                {OBSERVATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </NativeSelectField>
              <TextField control={form.control} name="observedDate" label="Date" type="date" />
            </div>
            {selectedType === 'status_change' ? (
              <NativeSelectField control={form.control} name="newStatus" label="New Status">
                {USER_PLANT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelectField>
            ) : (
              <TextAreaField
                control={form.control}
                name="note"
                label="Note"
                rows={2}
                placeholder="What did you observe?"
              />
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={!form.formState.isValid || addObservation.isPending}
              >
                {addObservation.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  form.reset({ type: 'general', observedDate: today, note: '', newStatus: 'planned' });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <PlusIcon className="size-3.5" />
          Add Observation
        </Button>
      )}
    </div>
  );
}
