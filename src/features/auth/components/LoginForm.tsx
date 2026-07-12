"use client";

import React, { useState } from "react";
import { useAuth } from "../../../core/context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { Button, Input, Checkbox } from "../../../components/ui";
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      await login({ email, password, rememberMe });
      success("Welcome back! Authenticating session...", "Access Granted");
    } catch (err: any) {
      error(err?.message || "Invalid credentials. Please verify and try again.", "Login Failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Demo auto-fill convenience for the user
  const handleDemoFill = () => {
    setEmail("superstep@yopmail.com");
    setPassword("password@123");
    setFormErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            className="pl-10"
          />
          <Mail className="absolute left-3 top-[34px] h-5 w-5 text-muted-foreground/60" />
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
            className="pl-10 pr-10"
          />
          <Lock className="absolute left-3 top-[34px] h-5 w-5 text-muted-foreground/60" />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-[34px] text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password Links */}
      <div className="flex items-center justify-between">
        <Checkbox
          label="Remember Me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Demo Autofill convenience */}
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleDemoFill}
          className="text-primary/80 hover:text-primary font-semibold transition-colors flex items-center gap-1"
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Fill Demo Credentials
        </button>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Sign In to Panel
      </Button>
    </form>
  );
}
