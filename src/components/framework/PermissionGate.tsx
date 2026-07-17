import React from "react";
import { useAuth } from "../../core/context/AuthContext";

export interface PermissionGateProps {
  permission: string | string[];
  allRequired?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  allRequired = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { user } = useAuth();

  // If user profile is not loaded or missing, deny access by default
  if (!user) {
    return <>{fallback}</>;
  }

  // Super Admin automatically bypasses all permission gates
  const isSuperAdmin = 
    user.role?.slug?.toLowerCase() === "superadmin" || 
    user.role?.slug?.toLowerCase() === "super_admin" || 
    user.email === "superstep@yopmail.com";
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Department Admin (admin role) has restricted view-only access to specific items
  const isDeptAdmin = user.role?.slug?.toLowerCase() === "admin";
  if (isDeptAdmin) {
    const allowedDeptPermissions = [
      "reports.view",
      "reports.export",
      "sessions.view",
      "scans.view",
      "gallery.view"
    ];
    const checkPermissions = Array.isArray(permission) ? permission : [permission];
    const hasPermission = allRequired
      ? checkPermissions.every((p) => allowedDeptPermissions.includes(p))
      : checkPermissions.some((p) => allowedDeptPermissions.includes(p));

    if (hasPermission) {
      return <>{children}</>;
    }
  }

  // Get user's active permissions array (fallback to empty)
  const userPermissions = (user as any).permissions || [];
  
  // Format check target to array
  const checkPermissions = Array.isArray(permission) ? permission : [permission];

  const hasPermission = allRequired
    ? checkPermissions.every((p) => userPermissions.includes(p))
    : checkPermissions.some((p) => userPermissions.includes(p));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
