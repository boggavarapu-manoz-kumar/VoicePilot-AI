import { ApiResponse, HealthStatus } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export class ApiErrorResponse extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Array<{ field: string; issue: string }>;

  constructor(status: number, code: string, message: string, details?: Array<{ field: string; issue: string }>) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Centralized typed fetch wrapper for REST communication with VoicePilot backend.
 */
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options?.headers || {});
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorCode = data?.error?.code || `HTTP_${response.status}`;
      const errorMessage = data?.error?.message || response.statusText || 'Unknown error occurred';
      const details = data?.error?.details;
      throw new ApiErrorResponse(response.status, errorCode, errorMessage, details);
    }

    return (data as ApiResponse<T>).data;
  } catch (error) {
    if (error instanceof ApiErrorResponse) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Network communication failed';
    throw new ApiErrorResponse(0, 'NETWORK_ERROR', message);
  }
}

/**
 * Health Client API
 */
export const healthApi = {
  checkHealth: (): Promise<HealthStatus> => {
    return apiRequest<HealthStatus>('/health');
  },
};
