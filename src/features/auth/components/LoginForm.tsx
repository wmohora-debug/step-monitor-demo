"use client";

import React, { useState } from "react";
import { useAuth } from "../../../core/context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { Button, Input } from "../../../components/ui";
import { Mail, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({ email, password, rememberMe: false });
      success("Welcome back! Authenticating session...", "Access Granted");
    } catch (err: any) {
      error(err?.message || "Invalid credentials. Please verify and try again.", "Login Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1 mb-6">
        <h2 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <KeyRound className="h-4.5 w-4.5 text-indigo-400" /> Console Authorization
        </h2>
        <p className="text-[11px] text-slate-400 font-medium">
          Provide access credentials to sign into the system.
        </p>
      </div>

      <div className="space-y-4">
        {/* Email Field */}
        <div className="relative">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={formErrors.email}
            className="pl-10 bg-slate-900/50 border-slate-800 text-slate-150 placeholder:text-slate-500 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/80"
          />
          <Mail className="absolute left-3 top-[34px] h-4.5 w-4.5 text-slate-500" />
        </div>

        {/* Password Field */}
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={formErrors.password}
            className="pl-10 pr-10 bg-slate-900/50 border-slate-800 text-slate-150 placeholder:text-slate-500 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/80"
          />
          <Lock className="absolute left-3 top-[34px] h-4.5 w-4.5 text-slate-500" />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-[34px] text-slate-550 hover:text-slate-200 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Forgot Password Link */}
      <div className="flex items-center justify-end text-xs">
        <Link
          href="/forgot-password"
          className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-indigo-650 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-550 text-white font-bold tracking-wide shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 py-2.5 transition-all duration-300 border-none cursor-pointer" 
        isLoading={isLoading}
      >
        Sign In to Panel
      </Button>
    </form>
  );
}
