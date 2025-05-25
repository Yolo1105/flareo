export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
} 