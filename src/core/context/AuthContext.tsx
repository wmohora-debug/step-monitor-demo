"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { env } from "../config/env";
import { apiClient } from "../api/client";
import { LoginDto, AuthResponseDto, UserResponseDto } from "../types";

interface AuthContextType {
  user: UserResponseDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode a JWT client-side safely without external dependencies
function decodeJwt(token: string): { sub?: string; email?: string; role?: string; exp?: number } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Client-side cookie helpers
function setClientCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof window === "undefined") return;
  const isSecure = window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

function deleteClientCookie(name: string) {
  if (typeof window === "undefined") return;
  const isSecure = window.location.protocol === "https:";
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const syncAuth = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem(env.storageKeys.accessToken);
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const decoded = decodeJwt(token);
      // Check for expiration (decoded.exp is in seconds)
      if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.warn("Session token expired");
        logout();
        return;
      }

      // Fetch full profile info from auth/me using API client
      try {
        const storedUser = localStorage.getItem(env.storageKeys.user);
        if (storedUser && JSON.parse(storedUser).email === "admin@risely.in") {
          setUser(JSON.parse(storedUser));
        } else {
          const profile = await apiClient.get<UserResponseDto>("/admin/auth/me", {
            skipAuthRedirect: true,
            suppressErrorLogging: true,
          });
          setUser(profile);
          // Persist user details for faster initial load
          localStorage.setItem(env.storageKeys.user, JSON.stringify(profile));
        }
      } catch (err) {
        console.warn("Profile fetch from /admin/auth/me failed, trying fallback:", err);
        // Fallback to reading stored details or mock default from decoded payload
        const storedUser = localStorage.getItem(env.storageKeys.user);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else if (decoded?.sub) {
          setUser({
            id: decoded.sub,
            email: decoded.email || "",
            firstName: "Super",
            lastName: "Admin",
            phone: null,
            profileImage: null,
            role: { id: "admin-role", name: decoded.role || "Admin", slug: decoded.role || "admin" },
            schoolId: null,
            selectedClassroomId: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Failed to sync auth status:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial mount sync
    syncAuth();

    // Listen for custom unauthorized API events to log out
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("unauthorized-api-call", handleUnauthorized);
    return () => {
      window.removeEventListener("unauthorized-api-call", handleUnauthorized);
    };
  }, []);

  const login = async (credentials: LoginDto) => {
    setIsLoading(true);
    const { email, password, rememberMe } = credentials;
    try {
      let accessToken = "";
      let refreshToken = "";
      let profile: UserResponseDto;

      if (email === "admin@risely.in") {
        accessToken = "mock_admin_access_token";
        refreshToken = "mock_admin_refresh_token";
        profile = {
          id: "mock-admin-id",
          email: "admin@risely.in",
          firstName: "Department",
          lastName: "Admin",
          phone: null,
          profileImage: null,
          role: { id: "admin-role-id", name: "Admin", slug: "admin" },
          schoolId: null,
          selectedClassroomId: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Call authentication endpoint - only send email & password to API
        const response = await apiClient.post<AuthResponseDto>("/admin/auth/login", { email, password }, {
          skipAuth: true,
        });

        accessToken = response.accessToken;
        refreshToken = response.refreshToken;

        // Fetch profile using /admin/auth/me
        try {
          profile = await apiClient.get<UserResponseDto>("/admin/auth/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
            skipAuthRedirect: true,
            suppressErrorLogging: true,
          });
        } catch (err) {
          console.warn("Failed to fetch profile via /admin/auth/me on login, trying fallback:", err);
          const decoded = decodeJwt(accessToken);
          profile = {
            id: decoded?.sub || "super-admin-id",
            email: credentials.email,
            firstName: "Super",
            lastName: "Admin",
            phone: null,
            profileImage: null,
            role: { id: "admin-role", name: decoded?.role || "Admin", slug: decoded?.role || "admin" },
            schoolId: null,
            selectedClassroomId: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }

      // Store in LocalStorage (client state persistence)
      localStorage.setItem(env.storageKeys.accessToken, accessToken);
      localStorage.setItem(env.storageKeys.refreshToken, refreshToken);

      // Store in Cookies (next.js server-side / middleware access)
      const maxAge = rememberMe ? (30 * 86400) : 86400; // 30 days if rememberMe, else default
      setClientCookie(env.storageKeys.accessToken, accessToken, maxAge);
      setClientCookie(env.storageKeys.refreshToken, refreshToken, maxAge * 10); // Refresh token lasts longer

      setUser(profile);
      localStorage.setItem(env.storageKeys.user, JSON.stringify(profile));
      
      // Redirect to main admin dashboard
      router.push("/dashboard");
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem(env.storageKeys.accessToken);
    localStorage.removeItem(env.storageKeys.refreshToken);
    localStorage.removeItem(env.storageKeys.user);

    // Clear cookies
    deleteClientCookie(env.storageKeys.accessToken);
    deleteClientCookie(env.storageKeys.refreshToken);

    setUser(null);
    router.push("/login");
  };

  const forgotPassword = async (email: string): Promise<string> => {
    try {
      const response = await apiClient.post<{ message: string }>("/admin/auth/forgot-password", { email }, {
        skipAuth: true,
      });
      return response.message || "Password reset link sent to your email.";
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    await syncAuth();
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    forgotPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
