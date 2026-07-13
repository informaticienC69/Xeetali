import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "./api";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

// Transform the fetcher to a unique key if none is provided.
// Since React Query needs a key, we generate a random key per hook instance
// if we cannot determine one. Ideally, components should migrate to useQuery directly.
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  
  // We use a generated key based on the function body for legacy compatibility, 
  // or a static key with deps. 
  // WARNING: This is a bridging strategy for Phase 2.
  const queryKey = [fetcher.toString().slice(0, 50), ...deps];

  const { data, isLoading, error, refetch } = useQuery<T, Error>({
    queryKey,
    queryFn: fetcher,
  });

  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  return { 
    data: data ?? null, 
    loading: isLoading, 
    error: error instanceof ApiError ? error.message : error?.message ?? null, 
    reload 
  };
}
