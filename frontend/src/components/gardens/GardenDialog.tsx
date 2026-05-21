import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gardenSchema, type GardenFormValues } from '@/schemas/gardens';
import { BED_UNITS, type Garden } from '@/types/gardens';
import { createGarden, updateGarden } from '@/api/gardens';
import { applyServerErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { TextField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';

type Props = {
  garden?: Garden;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues = (garden?: Garden): GardenFormValues => ({
  name: garden?.name ?? '',
  description: garden?.description ?? '',
  length: garden?.length != null ? String(garden.length) : '',
  width: garden?.width != null ? String(garden.width) : '',
  unit: garden?.unit ?? 'ft',
});

export default function GardenDialog({ garden, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!garden;

  const form = useForm<GardenFormValues>({
    resolver: zodResolver(gardenSchema),
    defaultValues: defaultValues(garden),
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) form.reset(defaultValues(garden));
  }, [open, garden]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (values: GardenFormValues) => {
      const payload = {
        name: values.name.trim(),
        description: values.description,
        length: values.length ? parseInt(values.length, 10) : null,
        width: values.width ? parseInt(values.width, 10) : null,
        unit: values.unit,
      };
      return isEditing ? updateGarden(garden.id, payload) : createGarden(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      onOpenChange(false);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'description', 'length', 'width', 'unit']);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Garden' : 'Add Garden'}</DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
          <TextField control={form.control} name="name" label="Name" placeholder="My Garden" />
          <TextAreaField control={form.control} name="description" label="Description" rows={3} />
          <div className="flex gap-3">
            <TextField control={form.control} name="length" label="Length" inputMode="numeric" placeholder="e.g. 20" />
            <TextField control={form.control} name="width" label="Width" inputMode="numeric" placeholder="e.g. 15" />
            <NativeSelectField control={form.control} name="unit" label="Unit">
              {BED_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </NativeSelectField>
          </div>

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!form.formState.isValid || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEditing ? 'Save' : 'Add Garden'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
