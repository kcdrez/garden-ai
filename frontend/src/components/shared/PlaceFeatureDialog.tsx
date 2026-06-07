import { useState, useEffect } from 'react';
import { FEATURE_OBJECT_TYPES, featureImage, featureEmoji, isCustomFeature } from '@/lib/features';
import type { FeatureObjectType } from '@/types/gardens';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: 'garden' | 'bed';
  onPlace: (objectType: FeatureObjectType, label: string) => void;
  isPlacing?: boolean;
};

export default function PlaceFeatureDialog({ open, onOpenChange, scope, onPlace, isPlacing }: Props) {
  const [selected, setSelected] = useState<FeatureObjectType | null>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setLabel('');
    }
  }, [open]);

  const visibleTypes = FEATURE_OBJECT_TYPES.filter(
    (f) => f.applicableTo === scope || f.applicableTo === 'both',
  );

  const needsLabel = selected ? isCustomFeature(selected) : false;
  const canSubmit = selected !== null && (!needsLabel || label.trim().length > 0);

  function handleSubmit() {
    if (!selected || !canSubmit) return;
    onPlace(selected, label.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Feature</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {visibleTypes.map((f) => {
            const img = featureImage(f.value);
            const isSelected = selected === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setSelected(f.value);
                  if (!isCustomFeature(f.value)) setLabel('');
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
          <div className="flex flex-col gap-1.5 mt-1">
            <Label htmlFor="feature-label">Label</Label>
            <Input
              id="feature-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Fairy Garden"
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPlacing}>
            {isPlacing ? 'Adding…' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
