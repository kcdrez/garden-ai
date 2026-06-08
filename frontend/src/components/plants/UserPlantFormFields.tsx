import type { Control } from 'react-hook-form';
import type { UserPlantFormValues } from '@/schemas/plants';
import type { Plant } from '@/types/plants';
import { TextField, TextAreaField } from '@/components/ui/form-fields';
import PlantPicker from '@/components/plants/PlantPicker';
import StatusPicker from '@/components/plants/StatusPicker';

type Props = {
  control: Control<UserPlantFormValues>;
  plants: Plant[];
};

export default function UserPlantFormFields({ control, plants }: Props) {
  return (
    <>
      <PlantPicker control={control} name="plant" plants={plants} />
      <TextField control={control} name="variety" label="Variety (optional)" placeholder="e.g. Cherry Tomato" />
      <TextField control={control} name="startDate" label="Start Date" type="date" />
      <StatusPicker control={control} name="status" />
      <TextAreaField control={control} name="notes" label="Notes" rows={3} placeholder="Any additional details…" />
    </>
  );
}
