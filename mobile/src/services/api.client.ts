export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// In local dev, configure backend API host (Android emulator uses 10.0.2.2, iOS / web uses localhost)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const body: ApiResponse<T> = await response.json();

  if (!response.ok || !body.success) {
    const errorMsg = body.error?.message || `Request failed with status ${response.status}`;
    const errorCode = body.error?.code || 'UNKNOWN_ERROR';
    const error = new Error(errorMsg) as Error & { code?: string; status?: number };
    error.code = errorCode;
    error.status = response.status;
    throw error;
  }

  return body.data as T;
}
