import { useState, useEffect, useCallback } from 'react';
import { get } from '../api';
import { cache } from '../cache';
import { type UseDataResult } from '@/types/hooks';

interface UseDataOptions<T> {
  url: string;
  cacheTime?: number;
  initialData?: T;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
  prefetch?: boolean;
}

export function useData<T>({
  url,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  initialData,
  onError,
  onSuccess,
  prefetch = false,
}: UseDataOptions<T>): UseDataResult<T> {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await get<T>(url, {
        cacheTime,
      });

      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [url, cacheTime, onSuccess, onError]);

  const invalidateCache = useCallback(() => {
    cache.delete(url);
  }, [url]);

  useEffect(() => {
    if (prefetch) {
      // 如果启用了预取，立即开始加载数据
      fetchData();
    } else {
      // 否则，等待组件挂载后再加载
      const timer = setTimeout(() => {
        fetchData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fetchData, prefetch]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    invalidateCache,
  };
} 