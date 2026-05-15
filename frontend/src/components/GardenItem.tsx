import type { Garden } from '../types/gardens';
import { api } from '../api/client';
import { getErrorMessage } from '../lib/errors';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type Props = {
  garden: Garden;
  onDeleted: (id: string) => void;
  onError?: (msg: string | null) => void;
};

export default function GardenItem({ garden, onDeleted, onError }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/gardens/${garden.id}/`);
      onDeleted(garden.id);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (onError) onError(msg);
      else console.error('Delete error:', msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="mb-2">
      <div className="flex items-center gap-3">
        <div>
          <strong>{garden.name}</strong>
          {garden.description && <div className="text-sm">{garden.description}</div>}
          <div className="text-muted-foreground text-xs">{garden.created_at}</div>
        </div>
        <div className="ml-auto">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </li>
  );
}
