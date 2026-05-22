import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userPlantSchema, type UserPlantFormValues } from '@/schemas/plants';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
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
import { FormRootError } from '@/components/ui/form-root-error';
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
  const needsGardenPicker = !gardenId;
  const needsBedPicker = !bedId;

  const defaultValues = (): UserPlantFormValues => ({
    gardenId: gardenId ?? '',
    bedId: bedId ?? '',
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

  useDialogFormReset(form, open, defaultValues);

  const selectedGardenId = form.watch('gardenId');

  const { data: gardens = [] } = useQuery({
    queryKey: ['gardens'],
    queryFn: fetchGardens,
    enabled: open && needsGardenPicker,
  });

  const { data: beds = [] } = useQuery({
    queryKey: ['beds', selectedGardenId],
    queryFn: () => fetchBeds(selectedGardenId),
    enabled: open && needsBedPicker && !!selectedGardenId,
  });

  const { data: plants = [] } = useQuery({
    queryKey: ['plants', 'catalog'],
    queryFn: fetchPlants,
    enabled: open,
  });

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
        ? updateUserPlant(values.gardenId, values.bedId, userPlant.id, payload)
        : createUserPlant(values.gardenId, values.bedId, payload);
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
          {(needsGardenPicker || needsBedPicker) && (
            <div className="grid grid-cols-2 gap-3">
              {needsGardenPicker && (
                <NativeSelectField
                  control={form.control}
                  name="gardenId"
                  label="Garden"
                  onValueChange={() => form.setValue('bedId', '', { shouldValidate: true })}
                >
                  <option value="">— Select —</option>
                  {gardens.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </NativeSelectField>
              )}
              {needsBedPicker && (
                <NativeSelectField
                  control={form.control}
                  name="bedId"
                  label="Bed"
                  className={!selectedGardenId ? 'opacity-50 pointer-events-none' : ''}
                >
                  <option value="">— Select —</option>
                  {beds.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </NativeSelectField>
              )}
            </div>
          )}

          <PlantPicker control={form.control} name="plant" plants={plants} />

          <TextField control={form.control} name="variety" label="Variety (optional)" placeholder="e.g. Cherry Tomato" />

          <div className="grid grid-cols-2 gap-3">
            <TextField control={form.control} name="startDate" label="Start Date" type="date" />
            <NativeSelectField control={form.control} name="status" label="Status">
              {USER_PLANT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </NativeSelectField>
          </div>

          <TextAreaField control={form.control} name="notes" label="Notes" rows={3} placeholder="Any additional details…" />

          <FormRootError message={form.formState.errors.root?.message} />

          <DialogFooter>
            <Button type="submit" disabled={!form.formState.isValid || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEditing ? 'Save' : 'Add Plant'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
