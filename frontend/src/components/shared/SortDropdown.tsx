import { GripVerticalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectClass } from '@/components/ui/form-fields';
import type { SortMode } from '@/hooks/useSortedList';

type Props = {
  value: SortMode;
  onChange: (mode: SortMode) => void;
  className?: string;
};

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'date-desc', label: 'Date Created (Newest)' },
  { value: 'date-asc', label: 'Date Created (Oldest)' },
  { value: 'custom', label: 'Custom (Drag & Drop)' },
];

export default function SortDropdown({ value, onChange, className }: Props) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      {value === 'custom' && (
        <GripVerticalIcon className="pointer-events-none absolute left-2 size-3.5 text-muted-foreground" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortMode)}
        className={cn(selectClass, value === 'custom' && 'pl-6')}
        aria-label="Sort order"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-muted-foreground">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
