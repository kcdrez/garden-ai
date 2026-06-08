import { QueryClient } from '@tanstack/react-query';
import { makeOptimisticMutation } from './mutations';

type Item = { id: string; value: number };
type Vars = { placementId: string; value: number };

const queryKey = ['test-key'];

function makeClient(initialData: Item[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  qc.setQueryData(queryKey, initialData);
  return qc;
}

function makeHandlers(qc: QueryClient, onExtraError?: (err: unknown, vars: Vars) => void) {
  return makeOptimisticMutation<Item, Vars>(
    qc,
    queryKey,
    (vars) => vars.placementId,
    (item, vars) => ({ ...item, value: vars.value }),
    onExtraError,
  );
}

describe('makeOptimisticMutation', () => {
  it('onMutate applies optimistic update to the cache', async () => {
    const qc = makeClient([{ id: 'item-1', value: 1 }]);
    const handlers = makeHandlers(qc);

    await handlers.onMutate({ placementId: 'item-1', value: 99 });

    expect(qc.getQueryData<Item[]>(queryKey)).toEqual([{ id: 'item-1', value: 99 }]);
  });

  it('onMutate returns previous data as context', async () => {
    const initial = [{ id: 'item-1', value: 1 }];
    const qc = makeClient(initial);
    const handlers = makeHandlers(qc);

    const context = await handlers.onMutate({ placementId: 'item-1', value: 99 });

    expect(context.previous).toEqual(initial);
  });

  it('onError rolls back the cache to the previous value', async () => {
    const initial = [{ id: 'item-1', value: 1 }];
    const qc = makeClient(initial);
    const handlers = makeHandlers(qc);

    const context = await handlers.onMutate({ placementId: 'item-1', value: 99 });
    handlers.onError(new Error('fail'), { placementId: 'item-1', value: 99 }, context);

    expect(qc.getQueryData<Item[]>(queryKey)).toEqual(initial);
  });

  it('onError calls onExtraError when provided', async () => {
    const qc = makeClient([]);
    const onExtraError = vi.fn();
    const handlers = makeHandlers(qc, onExtraError);
    const err = new Error('fail');
    const vars = { placementId: 'item-1', value: 99 };

    const context = await handlers.onMutate(vars);
    handlers.onError(err, vars, context);

    expect(onExtraError).toHaveBeenCalledWith(err, vars);
  });

  it('onError does not throw when context is undefined', () => {
    const qc = makeClient([]);
    const handlers = makeHandlers(qc);

    expect(() =>
      handlers.onError(new Error('fail'), { placementId: 'item-1', value: 99 }, undefined),
    ).not.toThrow();
  });
});
