import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gardenSchema, type GardenFormValues } from '@/schemas/gardens';
import { fetchGardens, createGarden } from '@/api/gardens';
import { applyServerErrors } from '@/lib/errors';
import GardenItem from '@/components/gardens/GardenItem';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, TextAreaField } from '@/components/ui/form-fields';
import { QueryState } from '@/components/ui/query-state';

export default function Gardens() {
  const queryClient = useQueryClient();

  const { data: gardens = [], isLoading, error } = useQuery({
    queryKey: ['gardens'],
    queryFn: fetchGardens,
  });

  const form = useForm<GardenFormValues>({
    resolver: zodResolver(gardenSchema),
    defaultValues: { name: '', description: '' },
    mode: 'onChange',
  });

  const createMutation = useMutation({
    mutationFn: createGarden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      form.reset();
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'description']);
    },
  });

  function onSubmit(values: GardenFormValues) {
    createMutation.mutate({ name: values.name.trim(), description: values.description });
  }

  return (
    <div className="p-5">
      <h2>Your Gardens</h2>

      <div className="mb-5 max-w-xl mx-auto">
        <Form form={form} onSubmit={onSubmit}>
          <TextField control={form.control} name="name" label="Name" placeholder="My Garden" />
          <TextAreaField control={form.control} name="description" label="Description" placeholder="Optional description" rows={3} />

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}

          <Button type="submit" disabled={!form.formState.isValid || createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create Garden'}
          </Button>
        </Form>
      </div>

      <QueryState isLoading={isLoading} error={error} isEmpty={gardens.length === 0} emptyMessage="No gardens yet.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gardens.map((g) => (
            <GardenItem key={g.id} garden={g} />
          ))}
        </div>
      </QueryState>
    </div>
  );
}
