import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { USER_PLANT_STATUSES, type UserPlant, type UserPlantStatus } from '@/types/plants';
import { updateUserPlant } from '@/api/plants';
import { STATUS_CLASSES } from '@/lib/plants';

type Props = {
  gardenId: string;
  bedId: string;
  plant: UserPlant;
};

export default function StatusChips({ gardenId, bedId, plant }: Props) {
  const queryClient = useQueryClient();

  const changeStatus = useMutation({
    mutationFn: (status: UserPlantStatus) =>
      updateUserPlant(gardenId, bedId, plant.id, { status }),
    onSuccess: (updatedPlant) => {
      // Directly update known caches so the UI reflects the new status immediately,
      // without waiting for a background refetch (staleTime: Infinity + initialData
      // means the detail query may not refetch on its own after invalidation).
      queryClient.setQueryData(['plants', 'user', 'detail', plant.id], updatedPlant);
      queryClient.setQueryData<UserPlant[]>(['plants', 'user', bedId], (old) =>
        old?.map((p) => (p.id === plant.id ? updatedPlant : p)) ?? old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.observations.byPlant(plant.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all() });
    },
  });

  return (
    <div>
      <p className="text-xs text-muted-foreground pb-2">Status</p>
      <div className="flex flex-wrap gap-1.5">
        {USER_PLANT_STATUSES.map((s) => {
          const isActive = plant.status === s.value;
          return (
            <button
              key={s.value}
              onClick={() => !isActive && changeStatus.mutate(s.value)}
              disabled={isActive || changeStatus.isPending}
              className={`text-xs px-2 py-0.5 rounded-full font-medium transition-opacity ${STATUS_CLASSES[s.value]} ${isActive ? 'ring-2 ring-ring ring-offset-1' : 'opacity-60 hover:opacity-100 cursor-pointer'} disabled:cursor-default`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
