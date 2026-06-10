import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bedSchema, type BedFormValues } from '@/schemas/beds';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import type { GardenBed } from '@/types/gardens';
import { updateBed } from '@/api/beds';
import { applyServerErrors } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormRootError } from '@/components/ui/form-root-error';
import BedFormFields from '@/components/beds/BedFormFields';
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
  orientation: String(bed.orientation ?? 0),
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
        orientation: parseInt(values.orientation, 10),
        avgSunlightHours: values.avgSunlightHours !== '' ? parseInt(values.avgSunlightHours, 10) : undefined,
        soilType: values.soilType || undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.beds.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.placements.garden(bed.garden) });
      onOpenChange(false);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'length', 'width', 'depth', 'unit', 'orientation', 'avgSunlightHours', 'soilType', 'notes']);
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
            <BedFormFields control={form.control} />
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
