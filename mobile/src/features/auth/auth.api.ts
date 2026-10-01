import { apiRequest } from '../../services/api.client';
import {
  AuthResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  SafeUser,
} from './auth.types';

export const authApi = {
  register(data: RegisterRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login(data: LoginRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  refreshTokens(refreshToken: string): Promise<AuthTokens> {
    return apiRequest<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  getMe(accessToken: string): Promise<{ user: SafeUser }> {
    return apiRequest<{ user: SafeUser }>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  logout(accessToken: string, refreshToken?: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
  },
};
