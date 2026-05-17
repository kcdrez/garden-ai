import { useState, useMemo } from 'react';
import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form';
import { SearchIcon, CheckIcon, LeafIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Plant, PlantCategory } from '@/types/plants';
import { PLANT_CATEGORIES } from '@/types/plants';
import { Input } from '@/components/ui/input';

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  plants: Plant[];
};

function PlantPicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, plants }: Props<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name });
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<PlantCategory | null>(null);

  const selectedPlant = plants.find((p) => p.id === field.value);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return plants.filter((p) => {
      const matchesSearch = !q || p.commonName.toLowerCase().includes(q);
      const matchesCategory = !activeCategory || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [plants, search, activeCategory]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium leading-none">Plant</label>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search plants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border transition-colors',
              !activeCategory
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted',
            )}
          >
            All
          </button>
          {PLANT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                activeCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {selectedPlant ? (
          <div className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md bg-primary/10 text-primary w-fit">
            <LeafIcon className="size-3 shrink-0" />
            <span className="font-medium">{selectedPlant.commonName}</span>
            <span className="text-primary/60 capitalize">{selectedPlant.category}</span>
          </div>
        ) : (
          <div className="text-xs px-2.5 py-1.5 text-muted-foreground">None selected</div>
        )}

        <div className="border rounded-md h-44 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3 text-center">No plants found.</p>
          ) : (
            <ul>
              {filtered.map((plant) => {
                const isSelected = field.value === plant.id;
                return (
                  <li key={plant.id}>
                    <button
                      type="button"
                      onClick={() => field.onChange(plant.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors',
                        isSelected ? 'bg-primary/10 font-medium' : 'hover:bg-muted',
                      )}
                    >
                      <span>{plant.commonName}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground capitalize">
                          {plant.category}
                        </span>
                        {isSelected && <CheckIcon className="size-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="text-sm text-destructive min-h-[1.25rem]">{fieldState.error?.message}</p>
    </div>
  );
}

export default PlantPicker;
