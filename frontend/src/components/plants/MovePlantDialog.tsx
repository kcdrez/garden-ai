import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from 'lucide-react';
import { fetchAllBeds, createBed } from '@/api/beds';
import { fetchGardens } from '@/api/gardens';
import { moveUserPlant } from '@/api/plants';
import type { UserPlant } from '@/types/plants';
import type { GardenBed } from '@/types/gardens';
import { BED_UNITS } from '@/types/gardens';
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

type Props = {
  userPlant: UserPlant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MovePlantDialog({ userPlant, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'pick' | 'create'>('pick');
  const [selectedBedId, setSelectedBedId] = useState('');

  const { data: beds = [], isLoading: bedsLoading } = useQuery({
    queryKey: ['beds', 'all'],
    queryFn: fetchAllBeds,
    enabled: open,
  });

  const { data: gardens = [] } = useQuery({
    queryKey: ['gardens'],
    queryFn: fetchGardens,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setStep('pick');
      setSelectedBedId('');
    }
  }, [open]);

  const availableBeds = beds.filter((b) => b.id !== userPlant.bed);

  const bedsByGarden = availableBeds.reduce<Record<string, { gardenName: string; beds: GardenBed[] }>>(
    (acc, bed) => {
      if (!acc[bed.garden]) acc[bed.garden] = { gardenName: bed.gardenName, beds: [] };
      acc[bed.garden].beds.push(bed);
      return acc;
    },
    {},
  );

  const moveMutation = useMutation({
    mutationFn: () => moveUserPlant(userPlant.gardenId, userPlant.bed, userPlant.id, selectedBedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      onOpenChange(false);
    },
  });

  const createForm = useForm<QuickBedFormValues>({
    resolver: zodResolver(quickBedSchema),
    defaultValues: { gardenId: userPlant.gardenId, name: '', length: '', width: '', unit: 'ft' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (step === 'create') {
      createForm.reset({ gardenId: userPlant.gardenId, name: '', length: '', width: '', unit: 'ft' });
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setSelectedBedId(newBed.id);
      setStep('pick');
    },
    onError: (err) => {
      applyServerErrors(err, createForm, ['name', 'length', 'width', 'unit']);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'pick' ? `Move ${userPlant.plantName} to Another Bed` : 'Create a New Bed'}
          </DialogTitle>
        </DialogHeader>

        {step === 'pick' ? (
          <>
            {bedsLoading ? (
              <div className="py-4 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : availableBeds.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No other beds yet.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto flex flex-col gap-4 py-1">
                {Object.values(bedsByGarden).map(({ gardenName, beds: gardenBeds }) => (
                  <div key={gardenName}>
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

            <button
              type="button"
              onClick={() => setStep('create')}
              className="text-sm text-primary hover:underline text-left"
            >
              + Create new bed
            </button>

            <DialogFooter>
              <Button
                onClick={() => moveMutation.mutate()}
                disabled={!selectedBedId || moveMutation.isPending}
              >
                {moveMutation.isPending ? 'Moving…' : 'Move Plant'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Form form={createForm} onSubmit={(v) => createMutation.mutate(v)}>
            <NativeSelectField control={createForm.control} name="gardenId" label="Garden">
              {gardens.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </NativeSelectField>

            <TextField
              control={createForm.control}
              name="name"
              label="Name"
              placeholder="Raised Bed 1"
            />

            <div className="grid grid-cols-3 gap-3">
              <TextField
                control={createForm.control}
                name="length"
                label="Length"
                inputMode="numeric"
              />
              <TextField
                control={createForm.control}
                name="width"
                label="Width"
                inputMode="numeric"
              />
              <NativeSelectField control={createForm.control} name="unit" label="Unit">
                {BED_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </NativeSelectField>
            </div>

            {createForm.formState.errors.root && (
              <p className="text-destructive text-sm">
                {createForm.formState.errors.root.message}
              </p>
            )}

            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('pick')}>
                <ArrowLeftIcon className="size-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={!createForm.formState.isValid || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating…' : 'Create Bed'}
              </Button>
            </DialogFooter>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
