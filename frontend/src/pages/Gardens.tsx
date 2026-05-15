import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGardens, createGarden } from '../api/gardens';
import { getErrorMessage } from '../lib/errors';
import GardenItem from '../components/GardenItem';
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

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Gardens() {
  const queryClient = useQueryClient();

  const { data: gardens = [], isLoading, error } = useQuery({
    queryKey: ['gardens'],
    queryFn: fetchGardens,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  const createMutation = useMutation({
    mutationFn: createGarden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      form.reset();
    },
    onError: (err) => {
      form.setError('root', { message: getErrorMessage(err) });
    },
  });

  function onSubmit(values: FormValues) {
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

          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create Garden'}
          </Button>
        </Form>
      </div>

      {isLoading && <div>Loading gardens...</div>}
      {error && <div className="text-destructive">Error: {getErrorMessage(error)}</div>}
      {!isLoading && !error && gardens.length === 0 && <div>No gardens yet.</div>}
      {!isLoading && !error && gardens.length > 0 && (
        <ul>
          {gardens.map((g) => (
            <GardenItem key={g.id} garden={g} />
          ))}
        </ul>
      )}
    </div>
  );
}
