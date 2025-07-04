// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

// Pagination types
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// API endpoints
export type ApiEndpoint = 
  | 'quiz'
  | 'topics'
  | 'users'
  | 'progress'
  | 'analytics'
  | 'auth';

// Request methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; 