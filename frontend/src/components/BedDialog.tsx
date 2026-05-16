import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GardenBed } from '@/types/gardens';
import { BED_UNITS, BED_FACINGS } from '@/types/gardens';
import { bedSchema, type BedFormValues } from '@/schemas/beds';
import { createBed, updateBed } from '@/api/beds';
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
import { cn } from '@/lib/utils';

const selectClass = cn(
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'dark:bg-input/30',
);

type Props = {
  gardenId: string;
  bed?: GardenBed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function BedDialog({
  gardenId,
  bed,
  open,
  onOpenChange,
}: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!bed;

  const defaultValues = (): BedFormValues => ({
    name: bed?.name ?? '',
    length: bed != null ? String(bed.length) : '',
    width: bed != null ? String(bed.width) : '',
    depth: bed?.depth != null ? String(bed.depth) : '',
    unit: bed?.unit ?? 'ft',
    facing: bed?.facing ?? undefined,
    avg_sunlight_hours:
      bed?.avg_sunlight_hours != null ? String(bed.avg_sunlight_hours) : '',
    soil_type: bed?.soil_type ?? '',
    notes: bed?.notes ?? '',
  });

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedSchema),
    defaultValues: defaultValues(),
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) form.reset(defaultValues());
  }, [open, bed]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (values: BedFormValues) => {
      const payload = {
        name: values.name.trim(),
        length: parseInt(values.length, 10),
        width: parseInt(values.width, 10),
        depth: values.depth !== '' ? parseInt(values.depth, 10) : undefined,
        unit: values.unit,
        facing: values.facing,
        avg_sunlight_hours:
          values.avg_sunlight_hours !== ''
            ? parseInt(values.avg_sunlight_hours, 10)
            : undefined,
        soil_type: values.soil_type || undefined,
        notes: values.notes || undefined,
      };
      return isEditing
        ? updateBed(gardenId, bed.id, payload)
        : createBed(gardenId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds', gardenId] });
      onOpenChange(false);
    },
    onError: (err) => {
      const fieldErrors = getDRFFieldErrors(err);
      if (fieldErrors) {
        const knownFields = [
          'name',
          'length',
          'width',
          'depth',
          'unit',
          'facing',
          'avg_sunlight_hours',
          'soil_type',
          'notes',
        ] as const;
        knownFields.forEach((f) => {
          if (fieldErrors[f]) form.setError(f, { message: fieldErrors[f][0] });
        });
        if (!knownFields.some((f) => fieldErrors[f])) {
          form.setError('root', { message: getErrorMessage(err) });
        }
      } else {
        form.setError('root', { message: getErrorMessage(err) });
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Bed' : 'Add Bed'}</DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Raised Bed 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="depth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depth</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="–" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <select {...field} className={selectClass}>
                    {BED_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="facing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facing</FormLabel>
                  <FormControl>
                    <select
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value || undefined)
                      }
                      className={selectClass}
                    >
                      <option value="">— None —</option>
                      {BED_FACINGS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avg_sunlight_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avg. Sunlight (hrs/day)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="–" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="soil_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Soil Type</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. loamy clay with amendments"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Any additional details…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={!form.formState.isValid || mutation.isPending}
            >
              {mutation.isPending ? 'Saving…' : isEditing ? 'Save' : 'Add Bed'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
