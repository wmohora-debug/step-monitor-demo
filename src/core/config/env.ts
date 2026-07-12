/**
 * Centralized environment configuration with validation and sensible defaults.
 */
export const env = {
  // Use the provided production-level API IP by default
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://43.205.146.243",
  apiPrefix: "/api/v1",
  
  // Storage keys for persisting authentication tokens
  storageKeys: {
    accessToken: "super_admin_access_token",
    refreshToken: "super_admin_refresh_token",
    user: "super_admin_user_profile",
  },
};

export type EnvConfig = typeof env;
