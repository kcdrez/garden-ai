import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gardenSchema, type GardenFormValues } from '@/schemas/gardens';
import { BED_UNITS, type Garden } from '@/types/gardens';
import { updateGarden } from '@/api/gardens';
import { applyServerErrors } from '@/lib/errors';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';
import { FormRootError } from '@/components/ui/form-root-error';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';

type Props = {
  garden: Garden;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues = (garden: Garden): GardenFormValues => ({
  name: garden.name,
  description: garden.description ?? '',
  length: garden.length != null ? String(garden.length) : '',
  width: garden.width != null ? String(garden.width) : '',
  unit: garden.unit ?? 'ft',
});

export default function GardenEditForm({ garden, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<GardenFormValues>({
    resolver: zodResolver(gardenSchema),
    defaultValues: defaultValues(garden),
    mode: 'onChange',
  });

  useDialogFormReset(form, open, () => defaultValues(garden));

  const mutation = useMutation({
    mutationFn: (values: GardenFormValues) =>
      updateGarden(garden.id, {
        name: values.name.trim(),
        description: values.description,
        length: values.length ? parseInt(values.length, 10) : null,
        width: values.width ? parseInt(values.width, 10) : null,
        unit: values.unit,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      onOpenChange(false);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'description', 'length', 'width', 'unit']);
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Garden</SheetTitle>
        </SheetHeader>
        <div className="px-4 flex-1 overflow-y-auto">
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
            <FormRootError message={form.formState.errors.root?.message} />
            <SheetFooter className="px-0">
              <Button type="submit" disabled={!form.formState.isValid || mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </SheetFooter>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
