"use client";

import React from "react";
import { useAuth } from "../../../src/core/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../src/components/ui/Card";
import { Button } from "../../../src/components/ui/Button";
import { Badge } from "../../../src/components/ui/Badge";
import { User, Mail, Shield, Phone, Calendar } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View your administrative account clearance details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar Card */}
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="h-24 w-24 rounded-full bg-primary/10 border-2 border-primary/20 text-primary flex items-center justify-center text-3xl font-bold mb-4 shadow">
            {user?.firstName?.charAt(0) || "S"}
          </div>
          <h2 className="text-lg font-bold">
            {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          <Badge variant="success" className="mt-4">
            Active clearance
          </Badge>
        </Card>

        {/* Right Side: Account Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Verify your active registry records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Full Name</p>
                  <p className="text-xs font-bold">{user ? `${user.firstName} ${user.lastName}` : "Super Admin"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Email Address</p>
                  <p className="text-xs font-bold truncate max-w-[180px]">{user?.email || "admin@example.com"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Clearance Role</p>
                  <p className="text-xs font-bold">{user?.role?.name || "Administrator"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Contact Number</p>
                  <p className="text-xs font-bold">{user?.phone || "Not Registered"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Registry Date</p>
                  <p className="text-xs font-bold">{formattedDate}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/60 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
