import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gardenSchema, type GardenFormValues } from '@/schemas/gardens';
import type { Garden } from '@/types/gardens';
import { updateGarden } from '@/api/gardens';
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
import { TextField, TextAreaField } from '@/components/ui/form-fields';

type Props = {
  garden: Garden;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditGardenDialog({ garden, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<GardenFormValues>({
    resolver: zodResolver(gardenSchema),
    defaultValues: { name: garden.name, description: garden.description ?? '' },
    mode: 'onChange',
  });

  const updateMutation = useMutation({
    mutationFn: (values: GardenFormValues) =>
      updateGarden(garden.id, { name: values.name.trim(), description: values.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      onOpenChange(false);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'description']);
    },
  });

  function onSubmit(values: GardenFormValues) {
    updateMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Garden</DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={onSubmit}>
          <TextField control={form.control} name="name" label="Name" />
          <TextAreaField control={form.control} name="description" label="Description" rows={3} />

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={!form.formState.isValid || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
