import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { fetchBeds, deleteBed } from '@/api/beds';
import { fetchUserPlants } from '@/api/plants';
import BedGrid from '@/components/beds/BedGrid';
import PlantListSection from '@/components/plants/PlantListSection';
import { getErrorMessage } from '@/lib/errors';
import { formatDimensions, bedHasDetails } from '@/lib/beds';
import { routes } from '@/lib/routes';
import type { GardenBed } from '@/types/gardens';
import type { UserPlant } from '@/types/plants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BedDetails from '@/components/beds/BedDetails';
import BedDialog from '@/components/beds/BedDialog';
import { LoadingSpinner } from '@/components/ui/query-state';

export default function BedDetail() {
  const { id, bedId } = useParams<{ id: string; bedId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

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
      navigate(routes.gardenDetail(id!));
    },
  });

  if (bedLoading) return <div className="p-5"><LoadingSpinner /></div>;
  if (bedError) return <div className="p-5 text-sm text-destructive">{getErrorMessage(bedError)}</div>;
  if (!bed) return null;

  return (
    <div className="p-5">
      <div className="mb-6">
        <Link
          to={routes.gardenDetail(id!)}
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

      {bedHasDetails(bed) && (
        <Card className="mb-6">
          <CardContent>
            <BedDetails bed={bed} />
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <h3 className="mb-3">Layout</h3>
        <BedGrid gardenId={id!} bedId={bedId!} bed={bed} userPlants={userPlants} />
      </div>

      <PlantListSection
        gardenId={id!}
        bedId={bedId!}
        userPlants={userPlants}
        isLoading={plantsLoading}
        error={plantsError}
      />

      <BedDialog gardenId={id!} bed={bed} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
