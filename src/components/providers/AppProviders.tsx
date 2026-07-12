"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "../../core/context/AuthContext";
import { ThemeProvider } from "../../core/context/ThemeContext";
import { ToastProvider } from "../../components/ui/Toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
