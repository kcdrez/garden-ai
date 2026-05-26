import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bedSchema, type BedFormValues } from '@/schemas/beds';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import { BED_UNITS, BED_FACINGS, type GardenBed } from '@/types/gardens';
import { updateBed } from '@/api/beds';
import { applyServerErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, NumberField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';
import { FormRootError } from '@/components/ui/form-root-error';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';

type Props = {
  bed: GardenBed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues = (bed: GardenBed): BedFormValues => ({
  gardenId: bed.garden,
  name: bed.name,
  length: String(bed.length),
  width: String(bed.width),
  depth: bed.depth != null ? String(bed.depth) : '',
  unit: bed.unit,
  facing: bed.facing ?? undefined,
  avgSunlightHours: bed.avgSunlightHours != null ? String(bed.avgSunlightHours) : '',
  soilType: bed.soilType ?? '',
  notes: bed.notes ?? '',
});

export default function BedEditForm({ bed, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedSchema),
    defaultValues: defaultValues(bed),
    mode: 'onChange',
  });

  useDialogFormReset(form, open, () => defaultValues(bed));

  const mutation = useMutation({
    mutationFn: (values: BedFormValues) =>
      updateBed(bed.garden, bed.id, {
        name: values.name.trim(),
        length: parseInt(values.length, 10),
        width: parseInt(values.width, 10),
        depth: values.depth !== '' ? parseInt(values.depth, 10) : undefined,
        unit: values.unit,
        facing: values.facing,
        avgSunlightHours: values.avgSunlightHours !== '' ? parseInt(values.avgSunlightHours, 10) : undefined,
        soilType: values.soilType || undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      onOpenChange(false);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'length', 'width', 'depth', 'unit', 'facing', 'avgSunlightHours', 'soilType', 'notes']);
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Bed</SheetTitle>
        </SheetHeader>
        <div className="px-4 flex-1 overflow-y-auto">
          <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
            <TextField control={form.control} name="name" label="Name" placeholder="Raised Bed 1" />
            <div className="grid grid-cols-3 gap-3">
              <NumberField control={form.control} name="length" label="Length" />
              <NumberField control={form.control} name="width" label="Width" />
              <NumberField control={form.control} name="depth" label="Depth" placeholder="–" />
            </div>
            <NativeSelectField control={form.control} name="unit" label="Unit">
              {BED_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </NativeSelectField>
            <div className="grid grid-cols-2 gap-3">
              <NativeSelectField control={form.control} name="facing" label="Facing" optional>
                <option value="">— None —</option>
                {BED_FACINGS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </NativeSelectField>
              <NumberField
                control={form.control}
                name="avgSunlightHours"
                label="Avg. Sunlight (hrs/day)"
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
            <FormRootError message={form.formState.errors.root?.message} />
            <SheetFooter className="px-0">
              <Button type="submit" disabled={!form.formState.isValid || mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </SheetFooter>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
