"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../src/components/ui/Button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error for diagnostic reporting
    console.error("Unhandled runtime system crash:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/5">
          <AlertCircle className="h-8 w-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">System Interrupted</h1>
          <p className="text-sm text-muted-foreground">
            A rendering pipeline crash occurred in this section. Details have been captured in the local admin log console.
          </p>
        </div>

        {/* Retry controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={reset} className="w-full sm:w-auto gap-2">
            <RefreshCw className="h-4 w-4" /> Recover Session
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            Full Page Reload
          </Button>
        </div>
      </div>
    </div>
  );
}
