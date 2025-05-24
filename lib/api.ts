import { cache } from './cache';

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  cacheTime?: number;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiError extends Error {
  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    cacheTime,
    ...fetchOptions
  } = options;

  const cacheKey = `${url}:${JSON.stringify(fetchOptions)}`;
  
  if (cacheTime) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData));
    }
  }

  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new ApiError(
          `HTTP error! status: ${response.status}`,
          response.status,
          await response.json().catch(() => null)
        );
      }

      if (cacheTime) {
        const data = await response.json();
        cache.set(cacheKey, data, cacheTime);
        return new Response(JSON.stringify(data));
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await delay(retryDelay * Math.pow(2, i));
      }
    }
  }

  throw lastError;
}

export async function get<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    method: 'GET',
  });
  return response.json();
}

export async function post<T>(
  url: string,
  data: any,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function put<T>(
  url: string,
  data: any,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function del<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    method: 'DELETE',
  });
  return response.json();
} 