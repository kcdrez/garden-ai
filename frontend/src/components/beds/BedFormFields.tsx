import type { Control } from 'react-hook-form';
import type { BedFormValues } from '@/schemas/beds';
import type { Garden } from '@/types/gardens';
import { BED_UNITS, NORTH_FACINGS } from '@/types/gardens';
import { TextField, NumberField, TextAreaField, NativeSelectField } from '@/components/ui/form-fields';

type Props = {
  control: Control<BedFormValues>;
  /** Pass the gardens list to show the garden picker (create dialog only). */
  gardens?: Garden[];
  showOrientation?: boolean;
};

export default function BedFormFields({ control, gardens, showOrientation = false }: Props) {
  return (
    <>
      {gardens && (
        <NativeSelectField control={control} name="gardenId" label="Garden">
          <option value="">— Select a garden —</option>
          {gardens.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </NativeSelectField>
      )}
      <TextField control={control} name="name" label="Name" placeholder="Raised Bed 1" />
      <div className="grid grid-cols-3 gap-3">
        <NumberField control={control} name="length" label="Length" />
        <NumberField control={control} name="width" label="Width" />
        <NumberField control={control} name="depth" label="Depth" placeholder="–" />
      </div>
      <NativeSelectField control={control} name="unit" label="Unit">
        {BED_UNITS.map((u) => (
          <option key={u.value} value={u.value}>{u.label}</option>
        ))}
      </NativeSelectField>
      <div className="grid grid-cols-2 gap-3">
        {showOrientation && (
          <NativeSelectField control={control} name="orientation" label="Top of bed faces">
            {NORTH_FACINGS.map((f) => (
              <option key={f.value} value={String(f.value)}>{f.label}</option>
            ))}
          </NativeSelectField>
        )}
        <NumberField control={control} name="avgSunlightHours" label="Avg. Sunlight (hrs/day)" placeholder="–" />
      </div>
      <TextField control={control} name="soilType" label="Soil Type" placeholder="e.g. loamy clay with amendments" />
      <TextAreaField control={control} name="notes" label="Notes" rows={3} placeholder="Any additional details…" />
    </>
  );
}
