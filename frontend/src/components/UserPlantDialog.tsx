import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userPlantSchema, type UserPlantFormValues } from '@/schemas/plants';
import { PLANT_CATEGORIES, USER_PLANT_STATUSES } from '@/types/plants';
import type { UserPlant } from '@/types/plants';
import { fetchPlants, createUserPlant, updateUserPlant } from '@/api/plants';
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
  bedId: string;
  userPlant?: UserPlant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function UserPlantDialog({ gardenId, bedId, userPlant, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!userPlant;

  const { data: plants = [] } = useQuery({
    queryKey: ['plants'],
    queryFn: fetchPlants,
  });

  const defaultValues = (): UserPlantFormValues => ({
    plant: userPlant?.plant ?? '',
    variety: userPlant?.variety ?? '',
    planted_date: userPlant?.planted_date ?? '',
    status: userPlant?.status ?? 'planned',
    notes: userPlant?.notes ?? '',
  });

  const form = useForm<UserPlantFormValues>({
    resolver: zodResolver(userPlantSchema),
    defaultValues: defaultValues(),
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) form.reset(defaultValues());
  }, [open, userPlant]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (values: UserPlantFormValues) => {
      const payload = {
        plant: values.plant,
        variety: values.variety || undefined,
        planted_date: values.planted_date || undefined,
        status: values.status,
        notes: values.notes || undefined,
      };
      return isEditing
        ? updateUserPlant(gardenId, bedId, userPlant.id, payload)
        : createUserPlant(gardenId, bedId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-plants', bedId] });
      onOpenChange(false);
    },
    onError: (err) => {
      const fieldErrors = getDRFFieldErrors(err);
      if (fieldErrors) {
        const knownFields = ['plant', 'variety', 'planted_date', 'status', 'notes'] as const;
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

  const byCategory = PLANT_CATEGORIES.map((cat) => ({
    ...cat,
    plants: plants.filter((p) => p.category === cat.value),
  })).filter((cat) => cat.plants.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plant' : 'Add Plant'}</DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
          <NativeSelectField control={form.control} name="plant" label="Plant">
            <option value="">— Select a plant —</option>
            {byCategory.map((cat) => (
              <optgroup key={cat.value} label={cat.label}>
                {cat.plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.common_name}
                  </option>
                ))}
              </optgroup>
            ))}
          </NativeSelectField>

          <TextField control={form.control} name="variety" label="Variety (optional)" placeholder="e.g. Cherokee Purple" />

          <div className="grid grid-cols-2 gap-3">
            <TextField control={form.control} name="planted_date" label="Planted Date" type="date" />
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
            <Button type="submit" disabled={!form.formState.isValid || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEditing ? 'Save' : 'Add Plant'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
