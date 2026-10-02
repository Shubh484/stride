import * as SecureStore from 'expo-secure-store';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Mutable API base URL — can be changed at runtime from the Server Config UI
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'fitness_api_base_url';
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

let _apiBaseUrl: string = DEFAULT_URL;
let _initialized = false;

/** Load the persisted server URL (call once at app start). */
export async function initApiBaseUrl(): Promise<void> {
  if (_initialized) return;
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) _apiBaseUrl = stored;
  } catch {
    // SecureStore can fail on some devices; fall back to default
  }
  _initialized = true;
}

/** Return the current API base URL. */
export function getApiBaseUrl(): string {
  return _apiBaseUrl;
}

/** Update the API base URL at runtime and persist it. */
export async function setApiBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, ''); // strip trailing slashes
  _apiBaseUrl = trimmed;
  await SecureStore.setItemAsync(STORAGE_KEY, trimmed);
}

/** Reset back to the compile-time default. */
export async function resetApiBaseUrl(): Promise<void> {
  _apiBaseUrl = DEFAULT_URL;
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

// In local dev, configure backend API host (Android emulator uses 10.0.2.2, iOS / web uses localhost)
export const API_BASE_URL = DEFAULT_URL; // kept for backward compat (prefer getApiBaseUrl())

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    // Surface the actual error and the URL being called for easier debugging
    const msg = networkError?.message || 'Unknown network error';
    throw new Error(`Network error connecting to ${url}: ${msg}`);
  }

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
