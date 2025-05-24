export interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  cacheTime?: number;
}

export interface ApiError extends Error {
  status?: number;
  data?: any;
} 