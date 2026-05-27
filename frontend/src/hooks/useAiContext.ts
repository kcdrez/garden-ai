import { useMatches } from 'react-router-dom';
import type { AiScope } from '@/types/ai';

export interface AiContext {
  scope: AiScope;
  entityId: string;
  label: string;
}

export function useAiContext(): AiContext | null {
  const matches = useMatches();

  // Walk matches deepest-first to find the most specific context
  for (const match of [...matches].reverse()) {
    const params = match.params as Record<string, string | undefined>;

    if (params.plantId) {
      return { scope: 'plant', entityId: params.plantId, label: 'Plant' };
    }
    if (params.bedId) {
      return { scope: 'bed', entityId: params.bedId, label: 'Bed' };
    }
    if (params.id) {
      return { scope: 'garden', entityId: params.id, label: 'Garden' };
    }
  }

  return null;
}
