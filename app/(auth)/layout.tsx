import React, { ReactNode } from "react";
import { Shield, KeyRound, Radio } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 overflow-hidden font-sans">
      {/* Background design elements */}
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />
      {/* Glow Rings */}
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-650/15 blur-[120px] pointer-events-none animate-pulse duration-[10s]" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-pulse duration-[8s]" />

      {/* Main card box - Split Grid on Desktop */}
      <div className="relative w-full max-w-5xl bg-slate-900/25 border border-slate-800/60 rounded-[2rem] shadow-2xl backdrop-blur-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px] transition-all duration-300">
        
        {/* Left column - Glowing HUD info panel (Hidden on mobile, visible on desktop) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/20 border-r border-slate-800/60 p-10 flex-col justify-between overflow-hidden">
          {/* Animated decorative shapes inside left panel */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
          
          {/* Top segment: Brand & Identity */}
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-slate-100 leading-tight tracking-wider uppercase">
                  STEP Monitor
                </span>
                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
                  State Wise Technical Education Programme
                </span>
              </div>
            </div>
          </div>

          {/* Middle segment: HUD & Interactive Telemetry Graphics */}
          <div className="space-y-6 my-auto py-8 relative z-10">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> System Active
              </span>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
                STEP Administration Portal
              </h1>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                STEP stands for State Wise Technical Education Programme. Log in to manage school operations, monitor activity, and maintain programme records.
              </p>
            </div>

            {/* Programme information box */}
            <div className="border border-slate-800/80 bg-slate-900/40 p-4 rounded-2xl space-y-3.5 backdrop-blur-xs">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider pb-2 border-b border-slate-800/50">
                <span>Programme Overview</span>
                <span className="text-indigo-400 font-bold">STEP</span>
              </div>
              <div className="space-y-2.5 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Programme Name</span>
                  <span className="text-slate-350 font-bold text-right">State Wise Technical Education Programme</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Access Type</span>
                  <span className="font-mono text-slate-350 font-bold flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-indigo-400" /> Authorized Admin Login
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Coverage</span>
                  <span className="font-mono text-indigo-400 font-bold">Statewide Technical Education</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom segment: Footer notice */}
          <div className="text-[9px] text-slate-500 font-semibold leading-relaxed relative z-10 flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-slate-650 animate-pulse" />
            <span>Encrypted endpoint verification active.</span>
          </div>
        </div>

        {/* Right column - Dynamic Page content card (LoginForm / ForgotPasswordForm) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-center p-8 sm:p-12 lg:p-14 bg-slate-950/20 relative">
          
          {/* Mobile view Logo Header (hidden on large displays) */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <div className="h-11 w-11 rounded-xl bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/5 mb-3.5">
              <Shield className="h-5.5 w-5.5" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-slate-100">
              STEP Administration Portal
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              Authorized Administrative clearance required.
            </p>
          </div>

          {/* Form and page elements */}
          <div className="w-full max-w-sm mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
