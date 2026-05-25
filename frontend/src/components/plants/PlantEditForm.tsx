import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userPlantSchema, type UserPlantFormValues } from '@/schemas/plants';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import { USER_PLANT_STATUSES } from '@/types/plants';
import type { UserPlant } from '@/types/plants';
import { fetchPlants, updateUserPlant } from '@/api/plants';
import { applyServerErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';
import { FormRootError } from '@/components/ui/form-root-error';
import PlantPicker from '@/components/plants/PlantPicker';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';

type Props = {
  userPlant: UserPlant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues = (userPlant: UserPlant): UserPlantFormValues => ({
  gardenId: userPlant.gardenId,
  bedId: userPlant.bed,
  plant: userPlant.plant,
  variety: userPlant.variety ?? '',
  startDate: userPlant.startDate ?? '',
  status: userPlant.status,
  notes: userPlant.notes ?? '',
});

export default function PlantEditForm({ userPlant, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const { data: plants = [] } = useQuery({
    queryKey: ['plants', 'catalog'],
    queryFn: fetchPlants,
    enabled: open,
  });

  const form = useForm<UserPlantFormValues>({
    resolver: zodResolver(userPlantSchema),
    defaultValues: defaultValues(userPlant),
    mode: 'onChange',
  });

  useDialogFormReset(form, open, () => defaultValues(userPlant));

  const mutation = useMutation({
    mutationFn: (values: UserPlantFormValues) =>
      updateUserPlant(userPlant.gardenId, userPlant.bed, userPlant.id, {
        plant: values.plant,
        variety: values.variety || undefined,
        startDate: values.startDate || undefined,
        status: values.status,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['observations', userPlant.id] });
      onOpenChange(false);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['plant', 'variety', 'startDate', 'status', 'notes']);
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Plant</SheetTitle>
        </SheetHeader>
        <div className="px-4 flex-1 overflow-y-auto">
          <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
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
