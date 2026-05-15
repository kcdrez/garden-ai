import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../api/client';
import type { Garden } from '../types/gardens';
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
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/gardens/');
        if (mounted) setGardens(res.data ?? []);
      } catch (err: unknown) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(values: FormValues) {
    try {
      const res = await api.post('/gardens/', {
        name: values.name.trim(),
        description: values.description ?? '',
      });
      setGardens((prev) => [res.data, ...prev]);
      form.reset();
    } catch (err: unknown) {
      form.setError('root', { message: getErrorMessage(err) });
    }
  }

  return (
    <div className="p-5">
      <h2>Your Gardens</h2>

      <div className="mb-5 max-w-xl">
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

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating…' : 'Create Garden'}
          </Button>
        </Form>
      </div>

      {loading && <div>Loading gardens...</div>}
      {error && <div className="text-destructive">Error: {error}</div>}
      {!loading && !error && gardens.length === 0 && <div>No gardens yet.</div>}
      {!loading && !error && gardens.length > 0 && (
        <ul>
          {gardens.map((g: Garden) => (
            <GardenItem
              key={g.id}
              garden={g}
              onDeleted={(id) => setGardens((prev) => prev.filter((x) => x.id !== id))}
              onError={setError}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
