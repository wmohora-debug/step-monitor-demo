"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../../src/components/ui/Button";

export default function ServerErrorPage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/5 animate-pulse">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-black tracking-tight text-primary">500</h1>
          <h2 className="text-xl font-bold tracking-tight">System Server Error</h2>
          <p className="text-sm text-muted-foreground">
            A critical network error or backend failure has occurred. Our engineers are investigating the system diagnostics.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <Button onClick={handleReload} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Reload System
          </Button>
        </div>
      </div>
    </div>
  );
}
