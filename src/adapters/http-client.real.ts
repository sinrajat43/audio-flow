import axios, { AxiosResponse } from 'axios';
import { IHttpClient, HttpResponse, HttpRequestConfig } from './http-client.interface';
import { logInfo } from '../utils/logger';

/**
 * Real HTTP Client Implementation
 * Uses axios for actual HTTP requests
 */
export class RealHttpClient implements IHttpClient {
  private convertResponse(axiosResponse: AxiosResponse): HttpResponse {
    return {
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers as Record<string, string>,
      data: axiosResponse.data,
    };
  }

  async get(url: string, config?: HttpRequestConfig): Promise<HttpResponse> {
    logInfo('HTTP GET request', { url });
    const response = await axios.get(url, config as any);
    return this.convertResponse(response);
  }

  async head(url: string, config?: HttpRequestConfig): Promise<HttpResponse> {
    logInfo('HTTP HEAD request', { url });
    const response = await axios.head(url, config as any);
    return this.convertResponse(response);
  }

  async post(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse> {
    logInfo('HTTP POST request', { url });
    const response = await axios.post(url, data, config as any);
    return this.convertResponse(response);
  }
}

