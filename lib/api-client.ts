import { env } from './env';
import { secureFetch } from './security';

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipCSRF?: boolean;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiClient {
  private baseUrl: string;
  private defaultConfig: RequestConfig;
  private csrfToken: string | null = null;

  constructor(baseUrl: string = env.API_URL) {
    this.baseUrl = baseUrl;
    this.defaultConfig = {
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    };
    this.initializeCSRF();
  }

  private initializeCSRF() {
    // 从 cookie 中获取 CSRF token
    const csrfCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='));
    
    if (csrfCookie) {
      this.csrfToken = decodeURIComponent(csrfCookie.split('=')[1]);
    }
  }

  private async refreshCSRFToken() {
    try {
      const response = await fetch(`${this.baseUrl}/csrf-token`, {
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.ok) {
        this.initializeCSRF();
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
    }
  }

  private getSecurityHeaders(config: RequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.defaultConfig.headers as Record<string, string>,
      ...(config.headers as Record<string, string> || {}),
    };

    // 添加 CSRF token
    if (!config.skipCSRF && this.csrfToken) {
      headers['X-CSRF-TOKEN'] = this.csrfToken;
    }

    // 添加安全相关的 headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';

    return headers;
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const { timeout, ...fetchConfig } = config;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
        credentials: 'include', // 始终包含 cookies
      });

      // 检查是否需要刷新 CSRF token
      if (response.status === 419) { // CSRF token mismatch
        await this.refreshCSRFToken();
        throw new Error('CSRF token mismatch');
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async retryRequest(
    url: string,
    config: RequestConfig,
    retries: number
  ): Promise<Response> {
    try {
      return await this.fetchWithTimeout(url, config);
    } catch (error) {
      if (retries > 0 && error instanceof Error) {
        if (error.name === 'AbortError' || error.message === 'CSRF token mismatch') {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          return this.retryRequest(url, config, retries - 1);
        }
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = new Error('API request failed');
      error.status = response.status;
      try {
        error.data = await response.json();
      } catch {
        error.data = await response.text();
      }
      throw error;
    }

    return response.json();
  }

  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const finalConfig = {
      ...this.defaultConfig,
      ...config,
      headers: this.getSecurityHeaders(config),
    };

    try {
      const response = await this.retryRequest(
        url,
        finalConfig,
        finalConfig.retries!
      );
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // 便捷方法
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// 创建单例实例
export const apiClient = new ApiClient();

// 导出类型
export type { RequestConfig, ApiError }; 