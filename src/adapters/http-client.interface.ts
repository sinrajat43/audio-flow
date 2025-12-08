/**
 * HTTP Client Interface
 * Abstract interface for making HTTP requests
 */

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}

export interface HttpRequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  responseType?: 'json' | 'arraybuffer' | 'text';
  maxContentLength?: number;
  validateStatus?: (status: number) => boolean;
}

export interface IHttpClient {
  /**
   * Make a GET request
   */
  get(url: string, config?: HttpRequestConfig): Promise<HttpResponse>;

  /**
   * Make a HEAD request
   */
  head(url: string, config?: HttpRequestConfig): Promise<HttpResponse>;

  /**
   * Make a POST request
   */
  post(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse>;
}

