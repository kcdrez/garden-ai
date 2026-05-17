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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { TextField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';

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
    avgSunlightHours:
      bed?.avgSunlightHours != null ? String(bed.avgSunlightHours) : '',
    soilType: bed?.soilType ?? '',
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
        avgSunlightHours:
          values.avgSunlightHours !== ''
            ? parseInt(values.avgSunlightHours, 10)
            : undefined,
        soilType: values.soilType || undefined,
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
          'avgSunlightHours',
          'soilType',
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Bed' : 'Add Bed'}</DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
          <TextField control={form.control} name="name" label="Name" placeholder="Raised Bed 1" />

          <div className="grid grid-cols-3 gap-3">
            <TextField control={form.control} name="length" label="Length" inputMode="numeric" />
            <TextField control={form.control} name="width" label="Width" inputMode="numeric" />
            <TextField control={form.control} name="depth" label="Depth" inputMode="numeric" placeholder="–" />
          </div>

          <NativeSelectField control={form.control} name="unit" label="Unit">
            {BED_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </NativeSelectField>

          <div className="grid grid-cols-2 gap-3">
            <NativeSelectField control={form.control} name="facing" label="Facing" optional>
              <option value="">— None —</option>
              {BED_FACINGS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </NativeSelectField>

            <TextField
              control={form.control}
              name="avgSunlightHours"
              label="Avg. Sunlight (hrs/day)"
              inputMode="numeric"
              placeholder="–"
            />
          </div>

          <TextField
            control={form.control}
            name="soilType"
            label="Soil Type"
            placeholder="e.g. loamy clay with amendments"
          />

          <TextAreaField control={form.control} name="notes" label="Notes" rows={3} placeholder="Any additional details…" />

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
