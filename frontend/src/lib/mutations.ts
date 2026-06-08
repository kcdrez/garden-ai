import type { QueryClient, QueryKey } from '@tanstack/react-query';

export type OptimisticContext<T> = { previous?: T[] };

/**
 * Builds the onMutate/onError/onSettled handlers for an optimistic-update mutation.
 * Spread the result into useMutation options alongside mutationFn.
 *
 * @param queryClient - The QueryClient instance
 * @param queryKey    - The cache key to snapshot, patch, and invalidate
 * @param getItemId   - Extracts the id of the item to update from mutation vars
 * @param applyUpdate - Pure function that returns the updated item given the mutation vars
 * @param onExtraError - Optional additional onError logic (e.g. surface an error message)
 */
export function makeOptimisticMutation<T extends { id: string }, Vars>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  getItemId: (vars: Vars) => string,
  applyUpdate: (item: T, vars: Vars) => T,
  onExtraError?: (err: unknown, vars: Vars) => void,
) {
  return {
    onMutate: async (vars: Vars): Promise<OptimisticContext<T>> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T[]>(queryKey);
      queryClient.setQueryData<T[]>(queryKey, (old = []) =>
        old.map((item) => (item.id === getItemId(vars) ? applyUpdate(item, vars) : item)),
      );
      return { previous };
    },
    onError: (err: unknown, vars: Vars, context: OptimisticContext<T> | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      onExtraError?.(err, vars);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  };
}
