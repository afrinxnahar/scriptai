/**
 * Centralized API client for backend requests
 * Handles authentication, error handling, file uploads, and type safety.
 * Client-side only - use in components and hooks.
 */
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosProgressEvent
} from 'axios';
import { createClient } from "@/lib/supabase/client";


export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Array<{ path: string; message: string }>;
  error?: string;
}

export class ApiClientError extends Error {
  statusCode: number;
  errors?: Array<{ path: string; message: string }>;

  constructor(message: string, statusCode: number, errors?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ServerClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

interface CustomRequestConfig extends AxiosRequestConfig {
  requireAuth?: boolean;
  // Expose upload progress callback for file uploads
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

// --- Configuration ---

function getBackendUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || '';
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

// Create the Axios Instance
const axiosInstance = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptors ---

// Request Interceptor: Handles Authentication
axiosInstance.interceptors.request.use(
  async (config) => {
    const customConfig = config as CustomRequestConfig;

    // Skip auth logic if header is already manually set
    if (config.headers['Authorization']) {
      return config;
    }

    // If requireAuth is true, we must attach the token
    if (customConfig.requireAuth) {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        } else {
          throw new ApiClientError('Authentication required', 401);
        }
      } catch (error) {
        if (error instanceof ApiClientError) throw error;
        // console.error('[API] Error attaching session:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Transforms Axios Errors into your Custom Error
axiosInstance.interceptors.response.use(
  (response) => response, // Return successful responses as-is
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const data = error.response.data;
      const status = error.response.status;

      if (data && Array.isArray(data.errors) && data.errors.length > 0) {
        const errorMessages = data.errors
          .map(err => `${err.path ? err.path + ': ' : ''}${err.message}`)
          .join(', ');

        throw new ApiClientError(
          errorMessages || data.message || 'Validation failed',
          status,
          data.errors
        );
      }

      // Handle Standard Error Format (message string)
      const message = data?.message || data?.error || error.message || 'An error occurred';
      throw new ApiClientError(message, status);

    } else if (error.request) {
      // The request was made but no response was received (Network Error)
      throw new ApiClientError('Network error. Please check your connection.', 0);
    } else {
      throw new ApiClientError(error.message, 500);
    }
  }
);


/**
 * Wrapper to extract data from Axios response
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: CustomRequestConfig = {}
): Promise<T> {
  const response: AxiosResponse<T> = await axiosInstance({
    url: endpoint,
    ...options,
  });

  return response.data;
}


export const api = {
  get: <T = unknown>(endpoint: string, options?: CustomRequestConfig) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, data?: unknown, options?: CustomRequestConfig) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', data }),

  put: <T = unknown>(endpoint: string, data?: unknown, options?: CustomRequestConfig) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', data }),

  patch: <T = unknown>(endpoint: string, data?: unknown, options?: CustomRequestConfig) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', data }),

  delete: <T = unknown>(endpoint: string, options?: CustomRequestConfig) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  /**
   * Dedicated method for uploading files using FormData.
   * Automatically handles 'multipart/form-data' headers.
   */
  upload: <T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: CustomRequestConfig
  ) => {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      data: formData,
      headers: {
        ...(options?.headers || {}),
        'Content-Type': 'multipart/form-data', // Axios will respect boundary
      },
    });
  },
};