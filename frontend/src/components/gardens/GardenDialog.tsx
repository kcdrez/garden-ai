import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gardenSchema, type GardenFormValues } from '@/schemas/gardens';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import type { Garden } from '@/types/gardens';
import { createGarden, updateGarden } from '@/api/gardens';
import { applyServerErrors } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { FormRootError } from '@/components/ui/form-root-error';
import GardenFormFields from '@/components/gardens/GardenFormFields';

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

  useDialogFormReset(form, open, () => defaultValues(garden));

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
      queryClient.invalidateQueries({ queryKey: queryKeys.gardens.list() });
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
          <GardenFormFields control={form.control} />
          <FormRootError message={form.formState.errors.root?.message} />

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
