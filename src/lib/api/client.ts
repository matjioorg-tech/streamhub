import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from './types';
import { getApiBaseUrl } from './config';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original.url?.includes('/auth/refresh')
    ) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
            `${getApiBaseUrl()}/auth/refresh`,
            { refreshToken },
          );
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return apiClient(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    }
    return Promise.reject(error);
  },
);

export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}
