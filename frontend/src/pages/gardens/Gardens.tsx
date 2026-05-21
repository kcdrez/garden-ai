import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gardenSchema, type GardenFormValues } from '@/schemas/gardens';
import { BED_UNITS } from '@/types/gardens';
import { fetchGardens, createGarden } from '@/api/gardens';
import { applyServerErrors } from '@/lib/errors';
import GardenItem from '@/components/gardens/GardenItem';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';
import { QueryState } from '@/components/ui/query-state';

export default function Gardens() {
  const queryClient = useQueryClient();

  const { data: gardens = [], isLoading, error } = useQuery({
    queryKey: ['gardens'],
    queryFn: fetchGardens,
  });

  const form = useForm<GardenFormValues>({
    resolver: zodResolver(gardenSchema),
    defaultValues: { name: '', description: '', length: '', width: '', unit: 'ft' },
    mode: 'onChange',
  });

  const createMutation = useMutation({
    mutationFn: createGarden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      form.reset();
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'description', 'length', 'width', 'unit']);
    },
  });

  function onSubmit(values: GardenFormValues) {
    createMutation.mutate({
      name: values.name.trim(),
      description: values.description,
      length: values.length ? parseInt(values.length, 10) : null,
      width: values.width ? parseInt(values.width, 10) : null,
      unit: values.unit,
    });
  }

  return (
    <div className="p-5">
      <h2>Your Gardens</h2>

      <div className="mb-5 max-w-xl mx-auto">
        <Form form={form} onSubmit={onSubmit}>
          <TextField control={form.control} name="name" label="Name" placeholder="My Garden" />
          <TextAreaField control={form.control} name="description" label="Description" placeholder="Optional description" rows={3} />
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
