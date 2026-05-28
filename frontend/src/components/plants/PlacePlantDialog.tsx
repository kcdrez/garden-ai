import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, LeafIcon } from 'lucide-react';
import type { UserPlantCreateFormValues } from '@/schemas/plants';
import type { UserPlant } from '@/types/plants';
import { createUserPlant } from '@/api/plants';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UserPlantForm from '@/components/plants/UserPlantForm';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: { x: number; y: number } | null;
  unplacedPlants: UserPlant[];
  onPlace: (userPlantId: string) => void;
  isPlacing: boolean;
  placeError?: string | null;
  gardenId: string;
  bedId: string;
};

export default function PlacePlantDialog({
  open,
  onOpenChange,
  unplacedPlants,
  onPlace,
  isPlacing,
  placeError = null,
  gardenId,
  bedId,
}: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'pick' | 'create'>('pick');

  useEffect(() => {
    if (!open) setStep('pick');
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (values: UserPlantCreateFormValues) =>
      createUserPlant(gardenId, bedId, {
        plant: values.plant,
        variety: values.variety || undefined,
        startDate: values.startDate || undefined,
        status: values.status,
        notes: values.notes || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      onPlace(data[0].id);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'pick' ? 'Place Plant' : 'New Plant'}
          </DialogTitle>
        </DialogHeader>

        {step === 'pick' ? (
          <div className="flex flex-col gap-3">
            {placeError && (
              <p className="text-sm text-destructive">{placeError}</p>
            )}
            {unplacedPlants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">
                No unplaced plants in this bed.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {unplacedPlants.map((plant) => (
                  <li key={plant.id}>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 h-auto py-2"
                      disabled={isPlacing}
                      onClick={() => onPlace(plant.id)}
                    >
                      <LeafIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm">
                        {plant.plantName}
                        {plant.variety && (
                          <span className="text-muted-foreground">
                            {' '}
                            — {plant.variety}
                          </span>
                        )}
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setStep('create')}
            >
              + Add new plant
            </Button>
          </div>
        ) : (
          <UserPlantForm
            open={step === 'create'}
            submitLabel="Add & Place"
            isPending={createMutation.isPending}
            onSubmit={async (values) => { await createMutation.mutateAsync(values); }}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 mb-1 gap-1.5 text-muted-foreground w-fit"
              onClick={() => setStep('pick')}
            >
              <ArrowLeftIcon className="size-3.5" />
              Back
            </Button>
          </UserPlantForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
