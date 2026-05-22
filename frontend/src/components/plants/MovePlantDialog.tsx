import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from 'lucide-react';
import { fetchAllBeds, createBed } from '@/api/beds';
import { fetchGardens } from '@/api/gardens';
import { moveUserPlant } from '@/api/plants';
import type { UserPlant } from '@/types/plants';
import { BED_UNITS } from '@/types/gardens';
import { groupByGarden } from '@/lib/beds';
import { quickBedSchema, type QuickBedFormValues } from '@/schemas/beds';
import { applyServerErrors } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { TextField, NativeSelectField } from '@/components/ui/form-fields';
import { LoadingSpinner } from '@/components/ui/query-state';

// --- PickBedStep ---

type PickBedStepProps = {
  userPlant: UserPlant;
  autoSelectBedId?: string;
  onMoved: () => void;
  onCreateNew: () => void;
};

function PickBedStep({ userPlant, autoSelectBedId, onMoved, onCreateNew }: PickBedStepProps) {
  const queryClient = useQueryClient();
  const [selectedBedId, setSelectedBedId] = useState('');

  const { data: beds = [], isLoading } = useQuery({
    queryKey: ['beds', 'all'],
    queryFn: fetchAllBeds,
  });

  useEffect(() => {
    if (autoSelectBedId) setSelectedBedId(autoSelectBedId);
  }, [autoSelectBedId]);

  const availableBeds = beds.filter((b) => b.id !== userPlant.bed);

  const bedsByGarden = groupByGarden(availableBeds);

  const moveMutation = useMutation({
    mutationFn: () => moveUserPlant(userPlant.gardenId, userPlant.bed, userPlant.id, selectedBedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['placements', userPlant.bed] });
      onMoved();
    },
  });

  return (
    <>
      {userPlant.placementId && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-md px-3 py-2">
          This plant is currently placed on the grid. Moving it will remove its placement.
        </p>
      )}

      {isLoading ? (
        <div className="py-4 flex justify-center"><LoadingSpinner /></div>
      ) : availableBeds.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No other beds yet.</p>
      ) : (
        <div className="max-h-56 overflow-y-auto flex flex-col gap-4 py-1">
          {bedsByGarden.map(({ gardenId, gardenName, beds: gardenBeds }) => (
            <div key={gardenId}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {gardenName}
              </p>
              <div className="flex flex-col gap-1">
                {gardenBeds.map((bed) => (
                  <button
                    key={bed.id}
                    type="button"
                    onClick={() => setSelectedBedId(bed.id)}
                    className={`text-left px-3 py-2 rounded-md text-sm border transition-colors ${
                      selectedBedId === bed.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/40 hover:bg-muted'
                    }`}
                  >
                    {bed.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={onCreateNew} className="text-sm text-primary hover:underline text-left">
        + Create new bed
      </button>

      <DialogFooter>
        <Button onClick={() => moveMutation.mutate()} disabled={!selectedBedId || moveMutation.isPending}>
          {moveMutation.isPending ? 'Moving…' : 'Move Plant'}
        </Button>
      </DialogFooter>
    </>
  );
}

// --- CreateBedStep ---

type CreateBedStepProps = {
  defaultGardenId: string;
  onSuccess: (newBedId: string) => void;
  onBack: () => void;
};

function CreateBedStep({ defaultGardenId, onSuccess, onBack }: CreateBedStepProps) {
  const queryClient = useQueryClient();

  const { data: gardens = [] } = useQuery({
    queryKey: ['gardens'],
    queryFn: fetchGardens,
  });

  const form = useForm<QuickBedFormValues>({
    resolver: zodResolver(quickBedSchema),
    defaultValues: { gardenId: defaultGardenId, name: '', length: '', width: '', unit: 'ft' },
    mode: 'onChange',
  });

  const createMutation = useMutation({
    mutationFn: (values: QuickBedFormValues) =>
      createBed(values.gardenId, {
        name: values.name.trim(),
        length: parseInt(values.length, 10),
        width: parseInt(values.width, 10),
        unit: values.unit,
      }),
    onSuccess: (newBed) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      onSuccess(newBed.id);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'length', 'width', 'unit']);
    },
  });

  return (
    <Form form={form} onSubmit={(v) => createMutation.mutate(v)}>
      <NativeSelectField control={form.control} name="gardenId" label="Garden">
        {gardens.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </NativeSelectField>

      <TextField control={form.control} name="name" label="Name" placeholder="Raised Bed 1" />

      <div className="grid grid-cols-3 gap-3">
        <TextField control={form.control} name="length" label="Length" inputMode="numeric" />
        <TextField control={form.control} name="width" label="Width" inputMode="numeric" />
        <NativeSelectField control={form.control} name="unit" label="Unit">
          {BED_UNITS.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </NativeSelectField>
      </div>

      {form.formState.errors.root && (
        <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
      )}

      <DialogFooter className="sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <Button type="submit" disabled={!form.formState.isValid || createMutation.isPending}>
          {createMutation.isPending ? 'Creating…' : 'Create Bed'}
        </Button>
      </DialogFooter>
    </Form>
  );
}

// --- MovePlantDialog ---

type Props = {
  userPlant: UserPlant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MovePlantDialog({ userPlant, open, onOpenChange }: Props) {
  const [step, setStep] = useState<'pick' | 'create'>('pick');
  const [autoSelectBedId, setAutoSelectBedId] = useState('');

  useEffect(() => {
    if (open) {
      setStep('pick');
      setAutoSelectBedId('');
    }
  }, [open]);

  function handleCreateSuccess(newBedId: string) {
    setAutoSelectBedId(newBedId);
    setStep('pick');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'pick' ? `Move ${userPlant.plantName} to Another Bed` : 'Create a New Bed'}
          </DialogTitle>
        </DialogHeader>

        {step === 'pick' ? (
          <PickBedStep
            userPlant={userPlant}
            autoSelectBedId={autoSelectBedId}
            onMoved={() => onOpenChange(false)}
            onCreateNew={() => setStep('create')}
          />
        ) : (
          <CreateBedStep
            defaultGardenId={userPlant.gardenId}
            onSuccess={handleCreateSuccess}
            onBack={() => setStep('pick')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
