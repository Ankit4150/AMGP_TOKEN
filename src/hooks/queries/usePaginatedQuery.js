import { useCallback, useEffect, useRef, useState } from "react";

export function usePaginatedQuery({
  queryKey,
  api,
  page,
  limit = 10,
  search = "",
  status = "all",
  extraParams = {},
  enabled = true,
}) {
  const controllerRef = useRef(null);
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const hasDataRef = useRef(false);
  const [isFetching, setIsFetching] = useState(false);
  const requestKey = JSON.stringify([...(queryKey || []), page, limit, search.trim(), status, extraParams]);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!silent && !hasDataRef.current) setIsLoading(true);
    setIsFetching(true);
    setError(null);
    try {
      const request = typeof api === "function" ? api : api?.list;
      if (typeof request !== "function") throw new Error("A valid API function is required.");
      const response = await request({
        page,
        limit,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status && status !== "all" ? { status } : {}),
        ...extraParams,
      }, controller.signal);
      if (!controller.signal.aborted) { setData(response); hasDataRef.current = true; }
      return response;
    } catch (err) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || controller.signal.aborted) return;
      setError(err);
      throw err;
    } finally {
      if (controller === controllerRef.current) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [api, page, limit, search, status, JSON.stringify(extraParams), enabled]);

  useEffect(() => {
    fetchData().catch(() => {});
    return () => controllerRef.current?.abort();
    // requestKey intentionally represents all request dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, enabled]);

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
