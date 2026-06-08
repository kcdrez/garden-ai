import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, LandmarkIcon, LeafIcon } from 'lucide-react';
import type { UserPlantCreateFormValues } from '@/schemas/plants';
import type { UserPlant } from '@/types/plants';
import type { FeatureObjectType } from '@/types/gardens';
import { createUserPlant } from '@/api/plants';
import { queryKeys } from '@/lib/queryKeys';
import { FEATURE_OBJECT_TYPES, featureImage, featureEmoji, isCustomFeature } from '@/lib/features';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UserPlantForm from '@/components/plants/dialogs/UserPlantForm';

type Step = 'choose' | 'plant-pick' | 'plant-create' | 'feature';

const TITLES: Record<Step, string> = {
  'choose': 'Add to Bed',
  'plant-pick': 'Add Plant',
  'plant-create': 'Add Plant',
  'feature': 'Add Feature',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: { x: number; y: number } | null;
  gardenId: string;
  bedId: string;
  unplacedPlants: UserPlant[];
  onPlace: (userPlantId: string) => void;
  isPlacing: boolean;
  placeError?: string | null;
  onPlaceFeature: (objectType: FeatureObjectType, label: string) => void;
  isPlacingFeature?: boolean;
};

export default function PlaceOnBedCanvasDialog({
  open,
  onOpenChange,
  gardenId,
  bedId,
  unplacedPlants,
  onPlace,
  isPlacing,
  placeError = null,
  onPlaceFeature,
  isPlacingFeature = false,
}: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('choose');
  const [selectedFeature, setSelectedFeature] = useState<FeatureObjectType | null>(null);
  const [featureLabel, setFeatureLabel] = useState('');

  useEffect(() => {
    if (!open) {
      setStep('choose');
      setSelectedFeature(null);
      setFeatureLabel('');
    }
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
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.user() });
      onPlace(data[0].id);
    },
  });

  const needsLabel = selectedFeature ? isCustomFeature(selectedFeature) : false;
  const canSubmitFeature = selectedFeature !== null && (!needsLabel || featureLabel.trim().length > 0);

  function handleFeatureSubmit() {
    if (!selectedFeature || !canSubmitFeature) return;
    onPlaceFeature(selectedFeature, featureLabel.trim());
  }

  const visibleFeatureTypes = FEATURE_OBJECT_TYPES.filter(
    (f) => f.applicableTo === 'bed' || f.applicableTo === 'both',
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TITLES[step]}</DialogTitle>
        </DialogHeader>

        {step === 'choose' && (
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => setStep('plant-pick')}
            >
              <LeafIcon className="size-5 shrink-0 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Place a Plant</div>
                <div className="text-xs text-muted-foreground">Add an existing plant or create a new one</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => setStep('feature')}
            >
              <LandmarkIcon className="size-5 shrink-0 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Place a Feature</div>
                <div className="text-xs text-muted-foreground">Add a structure, decoration, or object</div>
              </div>
            </Button>
          </div>
        )}

        {step === 'plant-pick' && (
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 -mt-1 gap-1.5 text-muted-foreground w-fit"
              onClick={() => setStep('choose')}
            >
              <ArrowLeftIcon className="size-3.5" />
              Back
            </Button>

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
                          <span className="text-muted-foreground"> — {plant.variety}</span>
                        )}
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button variant="outline" className="w-full" onClick={() => setStep('plant-create')}>
              + Add new plant
            </Button>
          </div>
        )}

        {step === 'plant-create' && (
          <UserPlantForm
            open={step === 'plant-create'}
            submitLabel="Add"
            isPending={createMutation.isPending}
            onSubmit={async (values) => { await createMutation.mutateAsync(values); }}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 mb-1 gap-1.5 text-muted-foreground w-fit"
              onClick={() => setStep('plant-pick')}
            >
              <ArrowLeftIcon className="size-3.5" />
              Back
            </Button>
          </UserPlantForm>
        )}

        {step === 'feature' && (
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 -mt-1 gap-1.5 text-muted-foreground w-fit"
              onClick={() => setStep('choose')}
            >
              <ArrowLeftIcon className="size-3.5" />
              Back
            </Button>

            <div className="grid grid-cols-3 gap-2">
              {visibleFeatureTypes.map((f) => {
                const img = featureImage(f.value);
                const isSelected = selectedFeature === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setSelectedFeature(f.value);
                      if (!isCustomFeature(f.value)) setFeatureLabel('');
                    }}
                    className={[
                      'flex flex-col items-center gap-1.5 rounded-md border p-2 text-center transition-colors',
                      'hover:bg-accent hover:border-accent-foreground/20',
                      isSelected ? 'border-primary bg-primary/10' : 'border-border bg-transparent',
                    ].join(' ')}
                  >
                    {isCustomFeature(f.value) ? (
                      <svg width="32" height="32" viewBox="0 0 32 32">
                        {f.shape === 'circle' ? (
                          <ellipse cx="16" cy="16" rx="13" ry="13" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" />
                        ) : (
                          <rect x="3" y="3" width="26" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" />
                        )}
                      </svg>
                    ) : img ? (
                      <img src={img} alt={f.label} className="size-8 object-contain" />
                    ) : (
                      <span className="text-2xl leading-none">{featureEmoji(f.value)}</span>
                    )}
                    <span className="text-xs leading-tight text-muted-foreground">{f.label}</span>
                  </button>
                );
              })}
            </div>

            {needsLabel && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="feature-label">Label</Label>
                <Input
                  id="feature-label"
                  value={featureLabel}
                  onChange={(e) => setFeatureLabel(e.target.value)}
                  placeholder="e.g. Fairy Garden"
                  autoFocus
                />
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleFeatureSubmit} disabled={!canSubmitFeature || isPlacingFeature}>
                {isPlacingFeature ? 'Adding…' : 'Add'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
