"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../src/core/context/AuthContext";
import { Skeleton } from "../src/components/ui/Skeleton";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="space-y-4 text-center max-w-sm w-full">
        {/* Loading Spinner */}
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 animate-pulse">
          S
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Synchronizing admin console...
          </h2>
          <Skeleton className="h-2 w-full max-w-[200px] mx-auto rounded-full bg-primary/20" />
        </div>
      </div>
    </div>
  );
}
