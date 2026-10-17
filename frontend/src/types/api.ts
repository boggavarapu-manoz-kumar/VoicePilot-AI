export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ComponentHealth {
  status: string;
  details: string;
}

export interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  timestamp: string;
  components: Record<string, ComponentHealth>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; issue: string }>;
}
