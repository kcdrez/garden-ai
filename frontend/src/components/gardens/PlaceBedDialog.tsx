import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, LayoutDashboardIcon } from 'lucide-react';
import type { GardenBed } from '@/types/gardens';
import { BED_UNITS } from '@/types/gardens';
import { createBed } from '@/api/beds';
import { formatDimensions } from '@/lib/beds';
import { applyServerErrors } from '@/lib/errors';
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: { x: number; y: number } | null;
  gardenId: string;
  unplacedBeds: GardenBed[];
  onPlace: (bedId: string) => void;
  isPlacing: boolean;
  placeError?: string | null;
};

export default function PlaceBedDialog({
  open,
  onOpenChange,
  gardenId,
  unplacedBeds,
  onPlace,
  isPlacing,
  placeError = null,
}: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'pick' | 'create'>('pick');

  useEffect(() => {
    if (!open) setStep('pick');
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

  useDialogFormReset(form, step === 'create', getDefaultValues);

  const createMutation = useMutation({
    mutationFn: (values: QuickBedFormValues) =>
      createBed(gardenId, {
        name: values.name.trim(),
        length: parseInt(values.length, 10),
        width: parseInt(values.width, 10),
        unit: values.unit,
      }),
    onSuccess: (bed) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      onPlace(bed.id);
    },
    onError: (err) => {
      applyServerErrors(err, form, ['name', 'length', 'width', 'unit']);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 'pick' ? 'Place a Bed' : 'New Bed'}</DialogTitle>
        </DialogHeader>

        {step === 'pick' ? (
          <div className="flex flex-col gap-3">
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

            <Button variant="outline" className="w-full" onClick={() => setStep('create')}>
              + Create new bed
            </Button>
          </div>
        ) : (
          <Form form={form} onSubmit={(v) => createMutation.mutate(v)}>
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
      </DialogContent>
    </Dialog>
  );
}
