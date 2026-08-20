import { api } from "@/lib/api";
import type {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  MessageResponse,
  OAuthLoginRequest,
  OAuthUrlResponse,
  RefreshRequest,
  RegisterRequest,
  UserResponse,
} from "@/types/api";

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/register", data);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", data);
    return res.data;
  },

  getOAuthUrl: async (provider: string, redirectUri: string): Promise<OAuthUrlResponse> => {
    const res = await api.get<OAuthUrlResponse>(`/auth/oauth/${provider}/url`, {
      params: { redirect_uri: redirectUri },
    });
    return res.data;
  },

  oauthLogin: async (
    provider: string,
    data: OAuthLoginRequest
  ): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(`/auth/oauth/${provider}`, data);
    return res.data;
  },


  refresh: async (data: RefreshRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/refresh", data);
    return res.data;
  },

  logout: async (data: LogoutRequest): Promise<MessageResponse> => {
    const res = await api.post<MessageResponse>("/auth/logout", data);
    return res.data;
  },

  getMe: async (): Promise<UserResponse> => {
    const res = await api.get<UserResponse>("/me");
    return res.data;
  },
};
