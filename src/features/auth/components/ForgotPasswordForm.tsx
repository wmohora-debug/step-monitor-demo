"use client";

import React, { useState } from "react";
import { useAuth } from "../../../core/context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { Button, Input } from "../../../components/ui";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    if (!email) {
      setEmailError("Email address is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const responseMsg = await forgotPassword(email);
      success(responseMsg, "Request Accepted");
      setIsSubmitted(true);
    } catch (err: any) {
      error(err?.message || "Something went wrong. Please check your email or connection and try again.", "Request Failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
          <Mail className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-100">Check your inbox</h3>
          <p className="text-xs text-slate-450 leading-relaxed">
            We have sent password reset instructions to <strong className="text-slate-200">{email}</strong> if it matches an existing account.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1 mb-6">
        <h2 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <KeyRound className="h-4.5 w-4.5 text-indigo-400" /> Recover Password
        </h2>
        <p className="text-[11px] text-slate-400 font-medium">
          Enter your recovery email to reset administrative credentials.
        </p>
      </div>

      <div className="space-y-4">
        {/* Email Field */}
        <div className="relative">
          <Input
            label="Recovery Email Address"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(undefined);
            }}
            error={emailError}
            className="pl-10 bg-slate-900/50 border-slate-800 text-slate-150 placeholder:text-slate-500 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/80"
          />
          <Mail className="absolute left-3 top-[34px] h-4.5 w-4.5 text-slate-500" />
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-indigo-650 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-550 text-white font-bold tracking-wide shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 py-2.5 transition-all duration-300 border-none cursor-pointer" 
        isLoading={isLoading}
      >
        Send Reset Link
      </Button>

      {/* Back link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
        </Link>
      </div>
    </form>
  );
}
