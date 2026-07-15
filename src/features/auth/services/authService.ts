import { apiClient } from "../../../core/api/client";
import { LoginDto, AuthResponseDto, ForgotPasswordDto, ForgotPasswordResponseDto, UserResponseDto } from "../../../core/types";

export const authService = {
  /**
   * Logs in an administrator and returns access/refresh tokens.
   */
  login: (credentials: LoginDto): Promise<AuthResponseDto> => {
    return apiClient.post<AuthResponseDto>("/admin/auth/login", credentials, {
      skipAuth: true,
    });
  },

  /**
   * Triggers a password reset request email for an admin.
   */
  forgotPassword: (data: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> => {
    return apiClient.post<ForgotPasswordResponseDto>("/admin/auth/forgot-password", data, {
      skipAuth: true,
    });
  },

  /**
   * Revokes all active sessions for a user (admin only).
   */
  revokeSessions: (userId: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/auth/sessions/${userId}`);
  },

  /**
   * Fetches the currently authenticated administrator's profile.
   */
  getMe: (): Promise<UserResponseDto> => {
    return apiClient.get<UserResponseDto>("/admin/auth/me");
  },
};
