import type { Control } from 'react-hook-form';
import type { GardenFormValues } from '@/schemas/gardens';
import { BED_UNITS, NORTH_FACINGS } from '@/types/gardens';
import { TextField, NumberField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';

type Props = {
  control: Control<GardenFormValues>;
  showNorthFacing?: boolean;
};

export default function GardenFormFields({ control, showNorthFacing = false }: Props) {
  return (
    <>
      <TextField control={control} name="name" label="Name" placeholder="My Garden" />
      <TextAreaField control={control} name="description" label="Description" rows={3} />
      <div className="flex gap-3">
        <NumberField control={control} name="length" label="Length" placeholder="e.g. 20" />
        <NumberField control={control} name="width" label="Width" placeholder="e.g. 15" />
        <NativeSelectField control={control} name="unit" label="Unit">
          {BED_UNITS.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </NativeSelectField>
      </div>
      {showNorthFacing && (
        <NativeSelectField control={control} name="orientation" label="Top of layout faces">
          {NORTH_FACINGS.map((f) => (
            <option key={f.value} value={String(f.value)}>{f.label}</option>
          ))}
        </NativeSelectField>
      )}
    </>
  );
}
