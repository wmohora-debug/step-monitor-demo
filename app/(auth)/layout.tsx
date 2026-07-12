import React, { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Sleek background details (gradients and meshes) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 dark:bg-indigo-950/15 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/30 dark:bg-indigo-900/10 blur-3xl" />

      {/* Main card box */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl dark:shadow-2xl/40 backdrop-blur-sm p-8 transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 animate-pulse">
            S
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
            Super Admin Control Center
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground text-center">
            Authorized administrative access protocol only.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
