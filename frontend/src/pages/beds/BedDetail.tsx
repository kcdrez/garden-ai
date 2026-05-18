import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  MoreHorizontalIcon,
  LeafIcon,
} from 'lucide-react';
import { fetchBeds, deleteBed } from '@/api/beds';
import { fetchUserPlants, deleteUserPlant } from '@/api/plants';
import { getErrorMessage } from '@/lib/errors';
import { formatDimensions } from '@/lib/beds';
import type { GardenBed } from '@/types/gardens';
import type { UserPlant } from '@/types/plants';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BedMeta from '@/components/beds/BedMeta';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import BedDialog from '@/components/beds/BedDialog';
import UserPlantDialog from '@/components/plants/UserPlantDialog';
import { QueryState, LoadingSpinner } from '@/components/ui/query-state';


export default function BedDetail() {
  const { id, bedId } = useParams<{ id: string; bedId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<UserPlant | undefined>();

  const {
    data: bed,
    isLoading: bedLoading,
    error: bedError,
  } = useQuery({
    queryKey: ['beds', 'garden', id],
    queryFn: () => fetchBeds(id!),
    enabled: !!id,
    select: (beds) => beds.find((b) => b.id === bedId),
    initialData: () => {
      const allBeds = queryClient.getQueryData<GardenBed[]>(['beds', 'all']);
      return allBeds?.filter((b) => b.garden === id);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['beds', 'all'])?.dataUpdatedAt || Date.now(),
  });

  const {
    data: userPlants = [],
    isLoading: plantsLoading,
    error: plantsError,
  } = useQuery({
    queryKey: ['plants', 'user', bedId],
    queryFn: () => fetchUserPlants(id!, bedId!),
    enabled: !!id && !!bedId,
    initialData: () => {
      const allPlants = queryClient.getQueryData<UserPlant[]>(['plants', 'user', 'all']);
      return allPlants?.filter((p) => p.bed === bedId);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['plants', 'user', 'all'])?.dataUpdatedAt || Date.now(),
  });

  const deleteBedMutation = useMutation({
    mutationFn: () => deleteBed(id!, bedId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      navigate(`/gardens/${id}`);
    },
  });

  const deleteUserPlantMutation = useMutation({
    mutationFn: (plantId: string) => deleteUserPlant(id!, bedId!, plantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plants', 'user'] }),
  });

  if (bedLoading) return <div className="p-5"><LoadingSpinner /></div>;
  if (bedError) return <div className="p-5 text-sm text-destructive">{getErrorMessage(bedError)}</div>;
  if (!bed) return null;

  const hasDetails = bed.facing || bed.avgSunlightHours != null || bed.soilType || bed.notes;

  return (
    <div className="p-5">
      <div className="mb-6">
        <Link
          to={`/gardens/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="size-4" />
          {bed.gardenName}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h2>{bed.name}</h2>
            <p className="text-muted-foreground mt-1">{formatDimensions(bed)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <PencilIcon className="size-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteBedMutation.isPending}
              onClick={() => deleteBedMutation.mutate()}
            >
              <Trash2Icon className="size-4" />
              {deleteBedMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>

      {hasDetails && (
        <Card className="mb-6">
          <CardContent>
            <BedMeta bed={bed} />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3>Plants</h3>
        <Button onClick={() => setAddPlantOpen(true)}>
          <PlusIcon className="size-4" />
          Add Plant
        </Button>
      </div>

      <QueryState
        isLoading={plantsLoading}
        error={plantsError}
        isEmpty={userPlants.length === 0}
        emptyMessage="No plants yet. Add one to get started."
      >
        <ul className="flex flex-col gap-2">
          {userPlants.map((up) => (
            <li key={up.id} className="flex items-center justify-between text-sm py-1">
              <span className="flex items-center gap-2">
                <LeafIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span>
                  {up.plantName}
                  {up.variety && <span className="text-muted-foreground"> — {up.variety}</span>}
                </span>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                  aria-label="Plant actions"
                >
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingPlant(up);
                      setAddPlantOpen(true);
                    }}
                  >
                    <PencilIcon />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={deleteUserPlantMutation.isPending}
                    onClick={() => deleteUserPlantMutation.mutate(up.id)}
                  >
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </QueryState>

      <BedDialog gardenId={id!} bed={bed} open={editOpen} onOpenChange={setEditOpen} />

      <UserPlantDialog
        gardenId={id!}
        bedId={bedId!}
        userPlant={editingPlant}
        open={addPlantOpen}
        onOpenChange={(open) => {
          setAddPlantOpen(open);
          if (!open) setEditingPlant(undefined);
        }}
      />
    </div>
  );
}
