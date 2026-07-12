"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "../../src/components/ui/Button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Lock Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/5 animate-pulse">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-black tracking-tight text-primary">403</h1>
          <h2 className="text-xl font-bold tracking-tight">Access Forbidden</h2>
          <p className="text-sm text-muted-foreground">
            You do not have the required administrative clearance to view this resource. Contact the system administrator if you believe this is a mistake.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
