import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, LandmarkIcon, LayoutDashboardIcon } from 'lucide-react';
import type { GardenBed } from '@/types/gardens';
import type { FeatureObjectType } from '@/types/gardens';
import { BED_UNITS } from '@/types/gardens';
import { createBed } from '@/api/beds';
import { queryKeys } from '@/lib/queryKeys';
import { formatDimensions } from '@/lib/beds';
import { applyServerErrors } from '@/lib/errors';
import { FEATURE_OBJECT_TYPES, featureImage, featureEmoji, isCustomFeature } from '@/lib/features';
import { quickBedSchema, type QuickBedFormValues } from '@/schemas/beds';
import { useDialogFormReset } from '@/hooks/useDialogFormReset';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { TextField, NumberField, NativeSelectField } from '@/components/ui/form-fields';
import { FormRootError } from '@/components/ui/form-root-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'choose' | 'bed-pick' | 'bed-create' | 'feature';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: { x: number; y: number } | null;
  gardenId: string;
  unplacedBeds: GardenBed[];
  onPlace: (bedId: string) => void;
  isPlacing: boolean;
  placeError?: string | null;
  onPlaceFeature: (objectType: FeatureObjectType, label: string) => void;
  isPlacingFeature?: boolean;
};

const TITLES: Record<Step, string> = {
  'choose': 'Add to Garden',
  'bed-pick': 'Place a Bed',
  'bed-create': 'New Bed',
  'feature': 'Add Feature',
};

export default function PlaceOnCanvasDialog({
  open,
  onOpenChange,
  gardenId,
  unplacedBeds,
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

  const getDefaultValues = (): QuickBedFormValues => ({
    gardenId,
    name: '',
    length: '',
    width: '',
    unit: 'ft',
  });

  const form = useForm<QuickBedFormValues>({
    resolver: zodResolver(quickBedSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  useDialogFormReset(form, step === 'bed-create', getDefaultValues);

  const createMutation = useMutation({
    mutationFn: (values: QuickBedFormValues) =>
      createBed(gardenId, {
        name: values.name.trim(),
        length: parseInt(values.length, 10),
        width: parseInt(values.width, 10),
        unit: values.unit,
      }),
    onSuccess: (bed) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.beds.list() });
      onPlace(bed.id);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'length', 'width', 'unit']);
    },
  });

  const needsLabel = selectedFeature ? isCustomFeature(selectedFeature) : false;
  const canSubmitFeature = selectedFeature !== null && (!needsLabel || featureLabel.trim().length > 0);

  function handleFeatureSubmit() {
    if (!selectedFeature || !canSubmitFeature) return;
    onPlaceFeature(selectedFeature, featureLabel.trim());
  }

  const visibleFeatureTypes = FEATURE_OBJECT_TYPES.filter(
    (f) => f.applicableTo === 'garden' || f.applicableTo === 'both',
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
              onClick={() => setStep('bed-pick')}
            >
              <LayoutDashboardIcon className="size-5 shrink-0 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Place a Bed</div>
                <div className="text-xs text-muted-foreground">Add an existing bed or create a new one</div>
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

        {step === 'bed-pick' && (
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
            {unplacedBeds.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">
                All beds in this garden are already placed on the canvas.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {unplacedBeds.map((bed) => (
                  <li key={bed.id}>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 h-auto py-2"
                      disabled={isPlacing}
                      onClick={() => onPlace(bed.id)}
                    >
                      <LayoutDashboardIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm">{bed.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{formatDimensions(bed)}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button variant="outline" className="w-full" onClick={() => setStep('bed-create')}>
              + Create new bed
            </Button>
          </div>
        )}

        {step === 'bed-create' && (
          <Form form={form} onSubmit={(v) => createMutation.mutate(v)}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 mb-1 gap-1.5 text-muted-foreground w-fit"
              onClick={() => setStep('bed-pick')}
            >
              <ArrowLeftIcon className="size-3.5" />
              Back
            </Button>

            <TextField control={form.control} name="name" label="Name" placeholder="Raised Bed 1" />

            <div className="grid grid-cols-2 gap-3">
              <NumberField control={form.control} name="length" label="Length" />
              <NumberField control={form.control} name="width" label="Width" />
            </div>

            <NativeSelectField control={form.control} name="unit" label="Unit">
              {BED_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </NativeSelectField>

            <FormRootError message={form.formState.errors.root?.message} />

            <DialogFooter>
              <Button
                type="submit"
                disabled={!form.formState.isValid || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating…' : 'Create & Place'}
              </Button>
            </DialogFooter>
          </Form>
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
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-transparent',
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
