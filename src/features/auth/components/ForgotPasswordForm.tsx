"use client";

import React, { useState } from "react";
import { useAuth } from "../../../core/context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { Button, Input } from "../../../components/ui";
import { Mail, ArrowLeft } from "lucide-react";
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
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/20 flex items-center justify-center">
          <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Check your inbox</h3>
          <p className="text-sm text-muted-foreground">
            We have sent password reset instructions to <strong className="text-foreground">{email}</strong> if it matches an existing account.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            className="pl-10"
          />
          <Mail className="absolute left-3 top-[34px] h-5 w-5 text-muted-foreground/60" />
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Send Reset Link
      </Button>

      {/* Back link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
        </Link>
      </div>
    </form>
  );
}
