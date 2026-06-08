/**
 * Centralized React Query key factories.
 * Use these instead of hardcoding key arrays at callsites.
 * Prefix-shaped keys (e.g. beds.list, plants.user) are used for broad invalidation
 * and match all more-specific sibling keys via React Query's prefix matching.
 */
export const queryKeys = {
  version: () => ['version'] as const,

  gardens: {
    list: () => ['gardens'] as const,
    detail: (id: string) => ['gardens', id] as const,
  },

  beds: {
    list: () => ['beds'] as const,
    byAll: () => ['beds', 'all'] as const,
    byGarden: (gardenId: string) => ['beds', 'garden', gardenId] as const,
  },

  plants: {
    catalog: () => ['plants', 'catalog'] as const,
    user: () => ['plants', 'user'] as const,
    userAll: () => ['plants', 'user', 'all'] as const,
    byBed: (bedId: string) => ['plants', 'user', bedId] as const,
    detail: (plantId: string) => ['plants', 'user', 'detail', plantId] as const,
  },

  placements: {
    bed: (bedId: string) => ['placements', bedId] as const,
    garden: (gardenId: string) => ['bed-placements', gardenId] as const,
    bedFeatures: (bedId: string) => ['bed-features', bedId] as const,
    gardenFeatures: (gardenId: string) => ['garden-features', gardenId] as const,
  },

  observations: {
    byPlant: (plantId: string) => ['observations', plantId] as const,
    detail: (plantId: string, gardenId: string, bedId: string) =>
      ['observations', plantId, gardenId, bedId] as const,
  },

  companionHints: (bedId: string) => ['companion-hints', bedId] as const,

  calendar: {
    all: () => ['calendar'] as const,
    byYear: (year: number) => ['calendar', year] as const,
  },

  profile: () => ['profile'] as const,

  ai: {
    conversations: (scope: string | undefined, entityId: string | undefined) =>
      ['ai-conversations', scope, entityId] as const,
    conversation: (id: string) => ['ai-conversation', id] as const,
  },
};
