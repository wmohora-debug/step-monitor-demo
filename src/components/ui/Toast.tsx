"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { cn } from "../../core/utils/cn";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    title?: string
  ) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", title?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      
      // Do not auto-remove loading toasts since they depend on promise settling
      if (type !== "loading") {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string, dur?: number) => toast(msg, "success", title, dur), [toast]);
  const error = useCallback((msg: string, title?: string, dur?: number) => toast(msg, "error", title, dur), [toast]);
  const warning = useCallback((msg: string, title?: string, dur?: number) => toast(msg, "warning", title, dur), [toast]);
  const info = useCallback((msg: string, title?: string, dur?: number) => toast(msg, "info", title, dur), [toast]);

  const promise = useCallback(
    async <T,>(
      p: Promise<T>,
      msgs: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: any) => string);
      },
      title?: string
    ): Promise<T> => {
      const id = Math.random().toString(36).substring(2, 9);
      
      // Add loading state
      setToasts((prev) => [...prev, { id, type: "loading", title, message: msgs.loading }]);

      try {
        const result = await p;
        // Remove loading state
        setToasts((prev) => prev.filter((t) => t.id !== id));
        // Show success state
        const successMsg = typeof msgs.success === "function" ? msgs.success(result) : msgs.success;
        success(successMsg, title);
        return result;
      } catch (err: any) {
        // Remove loading state
        setToasts((prev) => prev.filter((t) => t.id !== id));
        // Show error state
        const errorMsg = typeof msgs.error === "function" ? msgs.error(err) : msgs.error;
        error(errorMsg, title);
        throw err;
      }
    },
    [success, error]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, promise }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 transform translate-y-0 animate-in slide-in-from-bottom-5",
              {
                "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300": t.type === "success",
                "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300": t.type === "error",
                "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300": t.type === "warning",
                "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300": t.type === "info",
                "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200": t.type === "loading",
              }
            )}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-500" />}
              {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-500" />}
              {t.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {t.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
              {t.type === "loading" && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
            </div>

            {/* Content */}
            <div className="flex-1">
              {t.title && <h4 className="font-semibold text-sm leading-5">{t.title}</h4>}
              <p className={cn("text-sm leading-5", t.title ? "mt-0.5" : "font-medium")}>{t.message}</p>
            </div>

            {/* Dismiss Button */}
            {t.type !== "loading" && (
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 rounded-lg p-0.5 text-current hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
