import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Garden } from '@/types/gardens';
import { updateGarden } from '@/api/gardens';
import { getErrorMessage, getDRFFieldErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

type Props = {
  garden: Garden;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditGardenDialog({ garden, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: garden.name, description: garden.description ?? '' },
    mode: 'onChange',
  });

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateGarden(garden.id, { name: values.name.trim(), description: values.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      onOpenChange(false);
    },
    onError: (err) => {
      const fieldErrors = getDRFFieldErrors(err);
      if (fieldErrors) {
        if (fieldErrors.name) form.setError('name', { message: fieldErrors.name[0] });
        if (fieldErrors.description)
          form.setError('description', { message: fieldErrors.description[0] });
        if (!fieldErrors.name && !fieldErrors.description)
          form.setError('root', { message: getErrorMessage(err) });
      } else {
        form.setError('root', { message: getErrorMessage(err) });
      }
    },
  });

  function onSubmit(values: FormValues) {
    updateMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Garden</DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={onSubmit}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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