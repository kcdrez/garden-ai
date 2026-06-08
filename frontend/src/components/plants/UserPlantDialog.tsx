import { useState, useEffect } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserPlant } from '@/types/plants';
import { createUserPlant } from '@/api/plants';
import { queryKeys } from '@/lib/queryKeys';
import { fetchGardens } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { selectClass } from '@/components/ui/form-fields';
import UserPlantEditForm from '@/components/plants/UserPlantEditForm';
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
    queryKey: queryKeys.gardens.list(),
    queryFn: fetchGardens,
    enabled: open && needsGardenPicker,
  });

  const { data: beds = [] } = useQuery({
    queryKey: queryKeys.beds.byGarden(selectedGardenId),
    queryFn: () => fetchBeds(selectedGardenId),
    enabled: open && needsBedPicker && !!selectedGardenId,
  });

  const effectiveGardenId = gardenId ?? selectedGardenId;
  const effectiveBedId = bedId ?? selectedBedId;

  const createMutation = useMutation({
    mutationFn: (values: Parameters<typeof createUserPlant>[2]) =>
      createUserPlant(effectiveGardenId, effectiveBedId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.companionHints(effectiveBedId) });
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
          <UserPlantEditForm
            open={open}
            userPlant={userPlant}
            onSuccess={() => onOpenChange(false)}
          />
        ) : (
          <UserPlantForm
            open={open}
            submitLabel="Add Plant"
            isPending={createMutation.isPending}
            showQuantity
            disabled={(needsGardenPicker && !selectedGardenId) || (needsBedPicker && !selectedBedId)}
            onSubmit={async (values) => {
              await createMutation.mutateAsync({
                plant: values.plant,
                variety: values.variety || undefined,
                startDate: values.startDate || undefined,
                status: values.status,
                notes: values.notes || undefined,
                quantity: parseInt(values.quantity, 10),
              });
            }}
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
