import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userPlantSchema, type UserPlantFormValues } from '@/schemas/plants';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import type { UserPlant } from '@/types/plants';
import { fetchPlants, updateUserPlant } from '@/api/plants';
import { applyServerErrors } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { FormRootError } from '@/components/ui/form-root-error';
import UserPlantFormFields from '@/components/plants/shared/UserPlantFormFields';

type Props = {
  open: boolean;
  userPlant: UserPlant;
  onSuccess: () => void;
};

export default function UserPlantEditForm({ open, userPlant, onSuccess }: Props) {
  const queryClient = useQueryClient();

  const getDefaultValues = (): UserPlantFormValues => ({
    gardenId: userPlant.gardenId,
    bedId: userPlant.bed,
    plant: userPlant.plant,
    variety: userPlant.variety ?? '',
    startDate: userPlant.startDate ?? '',
    status: userPlant.status,
    notes: userPlant.notes ?? '',
  });

  const form = useForm<UserPlantFormValues>({
    resolver: zodResolver(userPlantSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  useDialogFormReset(form, open, getDefaultValues);

  const { data: plants = [] } = useQuery({
    queryKey: queryKeys.plants.catalog(),
    queryFn: fetchPlants,
    enabled: open,
  });

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
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.observations.byPlant(userPlant.id) });
      onSuccess();
    },
    onError: (err) => {
      applyServerErrors(err, form, ['plant', 'variety', 'startDate', 'status', 'notes']);
    },
  });

  return (
    <Form form={form} onSubmit={(v) => mutation.mutate(v)}>
      <UserPlantFormFields control={form.control} plants={plants} />
      <FormRootError message={form.formState.errors.root?.message} />
      <DialogFooter>
        <Button type="submit" disabled={!form.formState.isValid || mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </Form>
  );
}
