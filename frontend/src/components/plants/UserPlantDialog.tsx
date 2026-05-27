import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDownIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userPlantSchema, type UserPlantFormValues, type UserPlantCreateFormValues } from '@/schemas/plants';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import { USER_PLANT_STATUSES } from '@/types/plants';
import type { UserPlant } from '@/types/plants';
import { fetchPlants, createUserPlant, updateUserPlant } from '@/api/plants';
import { fetchGardens } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { applyServerErrors } from '@/lib/errors';
import { cn } from '@/lib/utils';
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
import { TextField, TextAreaField, NativeSelectField, selectClass } from '@/components/ui/form-fields';
import PlantPicker from '@/components/plants/PlantPicker';
import UserPlantForm from '@/components/plants/UserPlantForm';

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

  // --- Edit mode ---

  const editDefaultValues = (): UserPlantFormValues => ({
    gardenId: userPlant?.gardenId ?? gardenId ?? '',
    bedId: userPlant?.bed ?? bedId ?? '',
    plant: userPlant?.plant ?? '',
    variety: userPlant?.variety ?? '',
    startDate: userPlant?.startDate ?? '',
    status: userPlant?.status ?? 'planned',
    notes: userPlant?.notes ?? '',
  });

  const editForm = useForm<UserPlantFormValues>({
    resolver: zodResolver(userPlantSchema),
    defaultValues: editDefaultValues(),
    mode: 'onChange',
  });

  useDialogFormReset(editForm, open && isEditing, editDefaultValues);

  const { data: editPlants = [] } = useQuery({
    queryKey: ['plants', 'catalog'],
    queryFn: fetchPlants,
    enabled: open && isEditing,
  });

  const updateMutation = useMutation({
    mutationFn: (values: UserPlantFormValues) =>
      updateUserPlant(values.gardenId, values.bedId, userPlant!.id, {
        plant: values.plant,
        variety: values.variety || undefined,
        startDate: values.startDate || undefined,
        status: values.status,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['observations', userPlant!.id] });
      onOpenChange(false);
    },
    onError: (err) => {
      applyServerErrors(err, editForm, ['plant', 'variety', 'startDate', 'status', 'notes']);
    },
  });

  // --- Create mode ---

  const needsGardenPicker = !isEditing && !gardenId;
  const needsBedPicker = !isEditing && !bedId;

  const [selectedGardenId, setSelectedGardenId] = useState(gardenId ?? '');
  const [selectedBedId, setSelectedBedId] = useState(bedId ?? '');

  useEffect(() => {
    if (open && !isEditing) {
      setSelectedGardenId(gardenId ?? '');
      setSelectedBedId(bedId ?? '');
    }
  }, [open, gardenId, bedId, isEditing]);

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

  const effectiveGardenId = gardenId ?? selectedGardenId;
  const effectiveBedId = bedId ?? selectedBedId;

  const createMutation = useMutation({
    mutationFn: (values: UserPlantCreateFormValues) =>
      createUserPlant(effectiveGardenId, effectiveBedId, {
        plant: values.plant,
        variety: values.variety || undefined,
        startDate: values.startDate || undefined,
        status: values.status,
        notes: values.notes || undefined,
        quantity: parseInt(values.quantity, 10),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plant' : 'Add Plant'}</DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <Form form={editForm} onSubmit={(v) => updateMutation.mutate(v)}>
            <PlantPicker control={editForm.control} name="plant" plants={editPlants} />
            <TextField control={editForm.control} name="variety" label="Variety (optional)" placeholder="e.g. Cherry Tomato" />
            <div className="grid grid-cols-2 gap-3">
              <TextField control={editForm.control} name="startDate" label="Start Date" type="date" />
              <NativeSelectField control={editForm.control} name="status" label="Status">
                {USER_PLANT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </NativeSelectField>
            </div>
            <TextAreaField control={editForm.control} name="notes" label="Notes" rows={3} placeholder="Any additional details…" />
            <FormRootError message={editForm.formState.errors.root?.message} />
            <DialogFooter>
              <Button type="submit" disabled={!editForm.formState.isValid || updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </Form>
        ) : (
          <UserPlantForm
            open={open}
            submitLabel="Add Plant"
            isPending={createMutation.isPending}
            showQuantity
            disabled={(needsGardenPicker && !selectedGardenId) || (needsBedPicker && !selectedBedId)}
            onSubmit={async (values) => { await createMutation.mutateAsync(values); }}
          >
            {(needsGardenPicker || needsBedPicker) && (
              <div className="grid grid-cols-2 gap-3">
                {needsGardenPicker && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="garden-select" className="text-sm font-medium leading-none">Garden</label>
                    <div className="relative">
                      <select
                        id="garden-select"
                        className={selectClass}
                        value={selectedGardenId}
                        onChange={(e) => {
                          setSelectedGardenId(e.target.value);
                          setSelectedBedId('');
                        }}
                      >
                        <option value="">— Select —</option>
                        {gardens.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    </div>
                  </div>
                )}
                {needsBedPicker && (
                  <div className={cn('flex flex-col gap-1.5', !selectedGardenId && 'opacity-50 pointer-events-none')}>
                    <label htmlFor="bed-select" className="text-sm font-medium leading-none">Bed</label>
                    <div className="relative">
                      <select
                        id="bed-select"
                        className={selectClass}
                        value={selectedBedId}
                        onChange={(e) => setSelectedBedId(e.target.value)}
                      >
                        <option value="">— Select —</option>
                        {beds.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </UserPlantForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
