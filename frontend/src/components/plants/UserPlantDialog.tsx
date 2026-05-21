import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userPlantSchema, type UserPlantFormValues } from '@/schemas/plants';
import { USER_PLANT_STATUSES } from '@/types/plants';
import type { UserPlant } from '@/types/plants';
import { fetchPlants, createUserPlant, updateUserPlant } from '@/api/plants';
import { fetchGardens } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { applyServerErrors } from '@/lib/errors';
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
import PlantPicker from '@/components/plants/PlantPicker';

type Props = {
  gardenId?: string;
  bedId?: string;
  userPlant?: UserPlant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function UserPlantDialog({ gardenId, bedId, userPlant, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!userPlant;
  const needsPicker = !gardenId || !bedId;

  const [selectedGardenId, setSelectedGardenId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const effectiveGardenId = gardenId ?? selectedGardenId;
  const effectiveBedId = bedId ?? selectedBedId;

  const { data: gardens = [] } = useQuery({
    queryKey: ['gardens'],
    queryFn: fetchGardens,
    enabled: open && !gardenId,
  });

  const { data: beds = [] } = useQuery({
    queryKey: ['beds', effectiveGardenId],
    queryFn: () => fetchBeds(effectiveGardenId),
    enabled: open && !bedId && !!effectiveGardenId,
  });

  const { data: plants = [] } = useQuery({
    queryKey: ['plants', 'catalog'],
    queryFn: fetchPlants,
    enabled: open,
  });

  const defaultValues = (): UserPlantFormValues => ({
    plant: userPlant?.plant ?? '',
    variety: userPlant?.variety ?? '',
    startDate: userPlant?.startDate ?? '',
    status: userPlant?.status ?? 'planned',
    notes: userPlant?.notes ?? '',
  });

  const form = useForm<UserPlantFormValues>({
    resolver: zodResolver(userPlantSchema),
    defaultValues: defaultValues(),
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues());
      setSelectedGardenId('');
      setSelectedBedId('');
    }
  }, [open, userPlant]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (values: UserPlantFormValues) => {
      const payload = {
        plant: values.plant,
        variety: values.variety || undefined,
        startDate: values.startDate || undefined,
        status: values.status,
        notes: values.notes || undefined,
      };
      return isEditing
        ? updateUserPlant(effectiveGardenId, effectiveBedId, userPlant.id, payload)
        : createUserPlant(effectiveGardenId, effectiveBedId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['observations', userPlant.id] });
      }
      onOpenChange(false);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['plant', 'variety', 'startDate', 'status', 'notes']);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plant' : 'Add Plant'}</DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
          {needsPicker && (
            <div className="grid grid-cols-2 gap-3">
              {!gardenId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Garden</label>
                  <select
                    value={selectedGardenId}
                    onChange={(e) => { setSelectedGardenId(e.target.value); setSelectedBedId(''); }}
                    className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Select —</option>
                    {gardens.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {!bedId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Bed</label>
                  <select
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    disabled={!effectiveGardenId}
                    className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">— Select —</option>
                    {beds.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <PlantPicker control={form.control} name="plant" plants={plants} />

          <TextField control={form.control} name="variety" label="Variety (optional)" placeholder="e.g. Cherry Tomato" />

          <div className="grid grid-cols-2 gap-3">
            <TextField control={form.control} name="startDate" label="Start Date" type="date" />
            <NativeSelectField control={form.control} name="status" label="Status">
              {USER_PLANT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </NativeSelectField>
          </div>

          <TextAreaField control={form.control} name="notes" label="Notes" rows={3} placeholder="Any additional details…" />

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!form.formState.isValid || mutation.isPending || (needsPicker && (!effectiveGardenId || !effectiveBedId))}>
              {mutation.isPending ? 'Saving…' : isEditing ? 'Save' : 'Add Plant'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
