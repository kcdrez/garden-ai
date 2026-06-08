import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GardenBed } from '@/types/gardens';
import { fetchGardens } from '@/api/gardens';
import { bedSchema, type BedFormValues } from '@/schemas/beds';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import { createBed, updateBed } from '@/api/beds';
import { applyServerErrors } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { FormRootError } from '@/components/ui/form-root-error';
import BedFormFields from '@/components/beds/BedFormFields';

type Props = {
  gardenId?: string;
  bed?: GardenBed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function BedDialog({ gardenId, bed, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!bed;
  const needsGardenPicker = !gardenId;

  const { data: gardens = [] } = useQuery({
    queryKey: queryKeys.gardens.list(),
    queryFn: fetchGardens,
    enabled: open && needsGardenPicker,
  });

  const defaultValues = (): BedFormValues => ({
    gardenId: gardenId ?? '',
    name: bed?.name ?? '',
    length: bed != null ? String(bed.length) : '',
    width: bed != null ? String(bed.width) : '',
    depth: bed?.depth != null ? String(bed.depth) : '',
    unit: bed?.unit ?? 'ft',
    facing: bed?.facing ?? undefined,
    avgSunlightHours: bed?.avgSunlightHours != null ? String(bed.avgSunlightHours) : '',
    soilType: bed?.soilType ?? '',
    notes: bed?.notes ?? '',
  });

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedSchema),
    defaultValues: defaultValues(),
    mode: 'onChange',
  });

  useDialogFormReset(form, open, defaultValues);

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
          values.avgSunlightHours !== '' ? parseInt(values.avgSunlightHours, 10) : undefined,
        soilType: values.soilType || undefined,
        notes: values.notes || undefined,
      };
      return isEditing
        ? updateBed(values.gardenId, bed.id, payload)
        : createBed(values.gardenId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.beds.list() });
      const gId = gardenId ?? bed?.garden;
      if (gId) queryClient.invalidateQueries({ queryKey: queryKeys.placements.garden(gId) });
      onOpenChange(false);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'length', 'width', 'depth', 'unit', 'facing', 'avgSunlightHours', 'soilType', 'notes']);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Bed' : 'Add Bed'}</DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
          <BedFormFields control={form.control} gardens={needsGardenPicker ? gardens : undefined} />
          <FormRootError message={form.formState.errors.root?.message} />

          <DialogFooter>
            <Button type="submit" disabled={!form.formState.isValid || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEditing ? 'Save' : 'Add Bed'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
