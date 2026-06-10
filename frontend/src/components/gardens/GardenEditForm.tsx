import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gardenSchema, type GardenFormValues } from '@/schemas/gardens';
import type { Garden } from '@/types/gardens';
import { updateGarden } from '@/api/gardens';
import { applyServerErrors } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormRootError } from '@/components/ui/form-root-error';
import GardenFormFields from '@/components/gardens/GardenFormFields';
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
  orientation: String(garden.orientation ?? 0),
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
        orientation: parseInt(values.orientation, 10),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gardens.list() });
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
            <GardenFormFields control={form.control} />
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
