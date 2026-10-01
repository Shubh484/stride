import { create } from 'zustand';
import { SafeUser, AuthTokens, LoginRequest, RegisterRequest } from './auth.types';
import { authApi } from './auth.api';
import { tokenStorage } from './token-storage';

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: SafeUser) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        set({ isInitialized: true, isLoading: false });
        return;
      }

      try {
        const { user } = await authApi.getMe(accessToken);
        set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
      } catch {
        // Access token expired — try refresh
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          await tokenStorage.clearTokens();
          set({ isInitialized: true, isLoading: false });
          return;
        }

        try {
          const tokens = await authApi.refreshTokens(refreshToken);
          await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
          const { user } = await authApi.getMe(tokens.accessToken);
          set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
        } catch {
          await tokenStorage.clearTokens();
          set({ isInitialized: true, isLoading: false });
        }
      }
    } catch {
      set({ isInitialized: true, isLoading: false });
    }
  },

  login: async (data: LoginRequest) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(data);
      await tokenStorage.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken,
      );
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(data);
      await tokenStorage.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken,
      );
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      if (accessToken) {
        await authApi.logout(accessToken, refreshToken ?? undefined).catch(() => {});
      }
    } finally {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user: SafeUser) => set({ user }),
}));
