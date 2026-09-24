import { useCallback, useEffect, useRef, useState } from "react";

const cache = new Map();
const listeners = new Set();

const keyOf = (key) => JSON.stringify(Array.isArray(key) ? key : [key]);
const matches = (key, target) => {
  if (!target) return true;
  const a = Array.isArray(key) ? key : [key];
  const b = Array.isArray(target) ? target : [target];
  return b.every((v, i) => JSON.stringify(a[i]) === JSON.stringify(v));
};

function emit(event) {
  listeners.forEach((listener) => listener(event));
}

export const queryClient = {
  invalidateQueries({ queryKey } = {}) {
    for (const [key] of cache) {
      let parsed;
      try { parsed = JSON.parse(key); } catch { continue; }
      if (matches(parsed, queryKey)) cache.delete(key);
    }
    emit({ type: "invalidate", queryKey });
  },
  setQueryData(queryKey, value) {
    cache.set(keyOf(queryKey), value);
    emit({ type: "set", queryKey, value });
  },
  getQueryData(queryKey) {
    return cache.get(keyOf(queryKey));
  },
};

export function useQuery({ queryKey, queryFn, enabled = true, select } = {}) {
  const stableKey = keyOf(queryKey);
  const mountedRef = useRef(true);
  const controllerRef = useRef(null);
  const [data, setData] = useState(() => {
    const cached = cache.get(stableKey);
    return cached === undefined ? undefined : (select ? select(cached) : cached);
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled && data === undefined);
  const [isFetching, setIsFetching] = useState(false);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!silent) setIsLoading((prev) => data === undefined ? true : prev);
    setIsFetching(true);
    setError(null);
    try {
      const response = await queryFn({ signal: controller.signal });
      if (!mountedRef.current || controller.signal.aborted) return response;
      cache.set(stableKey, response);
      const next = select ? select(response) : response;
      setData(next);
      return response;
    } catch (err) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || controller.signal.aborted) return;
      if (mountedRef.current) setError(err);
      throw err;
    } finally {
      if (mountedRef.current && controller === controllerRef.current) {
        setIsFetching(false);
        setIsLoading(false);
      }
    }
  }, [stableKey, enabled, queryFn, select, data]);

  useEffect(() => {
    mountedRef.current = true;
    const listener = (event) => {
      if (!matches(queryKey, event.queryKey)) return;
      if (event.type === "set") setData(select ? select(event.value) : event.value);
      if (event.type === "invalidate") fetchData({ silent: true }).catch(() => {});
    };
    listeners.add(listener);
    if (enabled) fetchData().catch(() => {});
    return () => {
      mountedRef.current = false;
      listeners.delete(listener);
      controllerRef.current?.abort();
    };
    // queryKey changes are represented by stableKey; fetchData is intentionally the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey, enabled]);

  return {
    data,
    error,
    isLoading,
    isPending: isLoading,
    isFetching,
    isError: Boolean(error),
    refetch: fetchData,
  };
}

export function useMutation({ mutationFn, onSuccess, onError, onSettled } = {}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const mutateAsync = useCallback(async (variables) => {
    setIsPending(true);
    setError(null);
    try {
      const response = await mutationFn(variables);
      await onSuccess?.(response, variables);
      return response;
    } catch (err) {
      setError(err);
      await onError?.(err, variables);
      throw err;
    } finally {
      setIsPending(false);
      await onSettled?.();
    }
  }, [mutationFn, onSuccess, onError, onSettled]);

  const mutate = useCallback((variables) => {
    mutateAsync(variables).catch(() => {});
  }, [mutateAsync]);

  return { mutate, mutateAsync, isPending, isLoading: isPending, isError: Boolean(error), error };
}

export function useQueryClient() {
  return queryClient;
}

export const useManualQuery = useQuery;
export const useManualMutation = useMutation;
export const useManualQueryClient = useQueryClient;
