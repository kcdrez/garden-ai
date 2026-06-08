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
import { Form } from '@/components/ui/form';
import { FormRootError } from '@/components/ui/form-root-error';
import UserPlantFormFields from '@/components/plants/UserPlantFormFields';
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
    queryKey: queryKeys.plants.catalog(),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.observations.byPlant(userPlant.id) });
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
            <UserPlantFormFields control={form.control} plants={plants} />
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
