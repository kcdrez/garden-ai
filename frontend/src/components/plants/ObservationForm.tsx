import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createObservation } from '@/api/plants';
import { queryKeys } from '@/lib/queryKeys';
import { observationSchema, type ObservationFormValues } from '@/schemas/plants';
import { OBSERVATION_TYPES, USER_PLANT_STATUSES } from '@/types/plants';
import { getTodayISO } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';

function defaultValues(): ObservationFormValues {
  return { type: 'general', observedDate: getTodayISO(), note: '', newStatus: 'planned' };
}

type Props = {
  gardenId: string;
  bedId: string;
  plantId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ObservationForm({ gardenId, bedId, plantId, onSuccess, onCancel }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
    defaultValues: defaultValues(),
    mode: 'onChange',
  });

  const selectedType = form.watch('type');

  const addObservation = useMutation({
    mutationFn: (values: ObservationFormValues) =>
      createObservation(gardenId, bedId, plantId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.observations.byPlant(plantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all() });
      form.reset(defaultValues());
      onSuccess();
    },
  });

  return (
    <Form form={form} onSubmit={(v) => addObservation.mutate(v)}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <NativeSelectField control={form.control} name="type" label="Type">
            {OBSERVATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </NativeSelectField>
          <TextField control={form.control} name="observedDate" label="Date" type="date" />
        </div>
        {selectedType === 'status_change' ? (
          <NativeSelectField control={form.control} name="newStatus" label="New Status">
            {USER_PLANT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
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
              form.reset(defaultValues());
              onCancel();
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Form>
  );
}
