import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, LeafIcon, ChevronDownIcon } from 'lucide-react';
import { deleteUserPlant } from '@/api/plants';
import type { UserPlant } from '@/types/plants';
import { Button } from '@/components/ui/button';
import CardActionsMenu from '@/components/ui/card-actions-menu';
import { QueryState } from '@/components/ui/query-state';
import PlantTimeline from '@/components/plants/PlantTimeline';
import UserPlantDialog from '@/components/plants/UserPlantDialog';
import MovePlantDialog from '@/components/plants/MovePlantDialog';

type Props = {
  gardenId: string;
  bedId: string;
  userPlants: UserPlant[];
  isLoading: boolean;
  error: Error | null;
};

export default function PlantListSection({
  gardenId,
  bedId,
  userPlants,
  isLoading,
  error,
}: Props) {
  const queryClient = useQueryClient();
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<UserPlant | undefined>();
  const [movingPlant, setMovingPlant] = useState<UserPlant | undefined>();
  const [expandedPlantId, setExpandedPlantId] = useState<string | undefined>();

  const deleteMutation = useMutation({
    mutationFn: (plantId: string) => deleteUserPlant(gardenId, bedId, plantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plants', 'user'] }),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2>Plants</h2>
        <Button onClick={() => setAddPlantOpen(true)}>
          <PlusIcon className="size-4" />
          Add Plant
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={userPlants.length === 0}
        emptyMessage="No plants yet. Add one to get started."
      >
        <ul className="flex flex-col gap-1">
          {userPlants.map((plant) => {
            const isExpanded = expandedPlantId === plant.id;
            return (
              <li key={plant.id}>
                <div className="flex items-center justify-between text-sm py-1">
                  <button
                    className="flex items-center gap-2 flex-1 text-left hover:text-foreground text-foreground"
                    onClick={() => setExpandedPlantId(isExpanded ? undefined : plant.id)}
                  >
                    <LeafIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>
                      {plant.plantName}
                      {plant.variety && (
                        <span className="text-muted-foreground"> — {plant.variety}</span>
                      )}
                    </span>
                    <ChevronDownIcon
                      className={`size-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <CardActionsMenu
                    label="Plant actions"
                    onEdit={() => { setEditingPlant(plant); setAddPlantOpen(true); }}
                    onMove={() => setMovingPlant(plant)}
                    onDelete={() => deleteMutation.mutate(plant.id)}
                    isDeleting={deleteMutation.isPending}
                  />
                </div>
                {isExpanded && (
                  <PlantTimeline gardenId={gardenId} bedId={bedId} plant={plant} />
                )}
              </li>
            );
          })}
        </ul>
      </QueryState>

      <UserPlantDialog
        gardenId={gardenId}
        bedId={bedId}
        userPlant={editingPlant}
        open={addPlantOpen}
        onOpenChange={(open) => {
          setAddPlantOpen(open);
          if (!open) setEditingPlant(undefined);
        }}
      />

      {movingPlant && (
        <MovePlantDialog
          userPlant={movingPlant}
          open={!!movingPlant}
          onOpenChange={(open) => { if (!open) setMovingPlant(undefined); }}
        />
      )}
    </>
  );
}
