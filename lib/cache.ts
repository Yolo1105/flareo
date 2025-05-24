interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheItem<any>>;
  private readonly defaultExpiresIn: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set<T>(key: string, data: T, expiresIn: number = this.defaultExpiresIn): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  isExpired(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return true;

    const now = Date.now();
    return now - item.timestamp > item.expiresIn;
  }
}

export const cache = Cache.getInstance();

// 缓存装饰器
export function withCache<T>(
  key: string,
  expiresIn?: number
): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      const cachedData = cache.get<T>(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, result, expiresIn);
      return result;
    };

    return descriptor;
  };
} 