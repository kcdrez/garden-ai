import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { userPlantCreateSchema, type UserPlantCreateFormValues } from '@/schemas/plants';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import { fetchPlants } from '@/api/plants';
import { queryKeys } from '@/lib/queryKeys';
import { applyServerErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { FormRootError } from '@/components/ui/form-root-error';
import { TextField, NumberField, TextAreaField } from '@/components/ui/form-fields';
import PlantPicker from '@/components/plants/shared/PlantPicker';
import StatusPicker from '@/components/plants/shared/StatusPicker';

type Props = {
  open: boolean;
  submitLabel: string;
  isPending: boolean;
  showQuantity?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  onSubmit: (values: UserPlantCreateFormValues) => Promise<void> | void;
};

const getDefaultValues = (): UserPlantCreateFormValues => ({
  plant: '',
  variety: '',
  startDate: new Date().toISOString().slice(0, 10),
  status: 'planned',
  notes: '',
  quantity: '1',
});

export default function UserPlantForm({
  open,
  submitLabel,
  isPending,
  showQuantity = false,
  disabled = false,
  children,
  onSubmit,
}: Props) {
  const form = useForm<UserPlantCreateFormValues>({
    resolver: zodResolver(userPlantCreateSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  useDialogFormReset(form, open, getDefaultValues);

  const { data: plants = [] } = useQuery({
    queryKey: queryKeys.plants.catalog(),
    queryFn: fetchPlants,
    enabled: open,
  });

  async function handleSubmit(values: UserPlantCreateFormValues) {
    try {
      await onSubmit(values);
    } catch (err) {
      applyServerErrors(err, form, ['plant', 'variety', 'startDate', 'status', 'notes']);
    }
  }

  return (
    <Form form={form} onSubmit={handleSubmit}>
      {children}

      <PlantPicker control={form.control} name="plant" plants={plants} />

      {showQuantity ? (
        <div className="grid grid-cols-2 gap-3">
          <TextField control={form.control} name="variety" label="Variety (optional)" placeholder="e.g. Cherry Tomato" />
          <NumberField control={form.control} name="quantity" label="Quantity" placeholder="1" />
        </div>
      ) : (
        <TextField control={form.control} name="variety" label="Variety (optional)" placeholder="e.g. Cherry Tomato" />
      )}

      <TextField control={form.control} name="startDate" label="Start Date" type="date" />
      <StatusPicker control={form.control} name="status" />

      <TextAreaField control={form.control} name="notes" label="Notes" rows={3} placeholder="Any additional details…" />

      <FormRootError message={form.formState.errors.root?.message} />

      <DialogFooter>
        <Button type="submit" disabled={!form.formState.isValid || isPending || disabled}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </DialogFooter>
    </Form>
  );
}
