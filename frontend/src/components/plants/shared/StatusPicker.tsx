import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form';
import { USER_PLANT_STATUSES, type UserPlantStatus } from '@/types/plants';
import { STATUS_CLASSES } from '@/lib/plants';

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
};

function StatusPicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, label = 'Status' }: Props<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {USER_PLANT_STATUSES.map((s) => {
          const isActive = field.value === s.value;
          return (
            <button
              key={s.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => field.onChange(s.value)}
              className={`text-xs px-2 py-0.5 rounded-full font-medium transition-opacity ${STATUS_CLASSES[s.value as UserPlantStatus]} ${isActive ? 'ring-2 ring-ring ring-offset-1' : 'opacity-60 hover:opacity-100 cursor-pointer'}`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-destructive min-h-[1.25rem]">{fieldState.error?.message}</p>
    </div>
  );
}

export default StatusPicker;
