"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "../../src/components/ui/Button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Shield Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/5 animate-pulse">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-black tracking-tight text-primary">401</h1>
          <h2 className="text-xl font-bold tracking-tight">Session Unauthorized</h2>
          <p className="text-sm text-muted-foreground">
            Your credentials could not be verified or your admin session has expired. Please log in again to establish a secure session.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login" className="w-full sm:w-auto">
            <Button className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" /> Go to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
