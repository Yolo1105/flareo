import { useCallback } from 'react';
import { get } from '../api';
import { cache } from '../cache';

interface PrefetchOptions {
  urls: string[];
  cacheTime?: number;
  onError?: (error: Error) => void;
  onSuccess?: (url: string) => void;
}

export function usePrefetch() {
  const prefetch = useCallback(async ({
    urls,
    cacheTime = 5 * 60 * 1000,
    onError,
    onSuccess,
  }: PrefetchOptions) => {
    const prefetchPromises = urls.map(async (url) => {
      try {
        const result = await get(url, {
          cacheTime,
        });
        onSuccess?.(url);
        return result;
      } catch (error) {
        onError?.(error as Error);
        return null;
      }
    });

    return Promise.all(prefetchPromises);
  }, []);

  const invalidateCache = useCallback((urls: string[]) => {
    urls.forEach(url => {
      cache.delete(url);
    });
  }, []);

  const prefetchAndInvalidate = useCallback(async ({
    urls,
    cacheTime,
    onError,
    onSuccess,
  }: PrefetchOptions) => {
    invalidateCache(urls);
    return prefetch({
      urls,
      cacheTime,
      onError,
      onSuccess,
    });
  }, [prefetch, invalidateCache]);

  return {
    prefetch,
    invalidateCache,
    prefetchAndInvalidate,
  };
} 