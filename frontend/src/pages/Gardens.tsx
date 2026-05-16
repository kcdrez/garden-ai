import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gardenSchema, type GardenFormValues } from '@/schemas/gardens';
import { fetchGardens, createGarden } from '@/api/gardens';
import { getErrorMessage, getDRFFieldErrors } from '@/lib/errors';
import GardenItem from '@/components/GardenItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

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
      const fieldErrors = getDRFFieldErrors(err);
      if (fieldErrors) {
        if (fieldErrors.name) form.setError('name', { message: fieldErrors.name[0] });
        if (fieldErrors.description) form.setError('description', { message: fieldErrors.description[0] });
        if (!fieldErrors.name && !fieldErrors.description) {
          form.setError('root', { message: getErrorMessage(err) });
        }
      } else {
        form.setError('root', { message: getErrorMessage(err) });
      }
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
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Garden" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional description" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}

          <Button type="submit" disabled={!form.formState.isValid || createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create Garden'}
          </Button>
        </Form>
      </div>

      {isLoading && <div>Loading gardens...</div>}
      {error && <div className="text-destructive">Error: {getErrorMessage(error)}</div>}
      {!isLoading && !error && gardens.length === 0 && <div>No gardens yet.</div>}
      {!isLoading && !error && gardens.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gardens.map((g) => (
            <GardenItem key={g.id} garden={g} />
          ))}
        </div>
      )}
    </div>
  );
}
