export type UserRole = "freelancer" | "admin";

export interface UserPermissions {
  role: UserRole;
  isAdmin: boolean;
  isFreelancer: boolean;
}

export interface PermissionCheck {
  canViewAllStudents: boolean;
  canViewAllFreelancers: boolean;
  canAssignStudents: boolean;
  canTransferOwnership: boolean;
  canViewSystemAnalytics: boolean;
  canManageUsers: boolean;
  canAccessAdminDashboard: boolean;
}

export const PERMISSIONS: Record<UserRole, PermissionCheck> = {
  admin: {
    canViewAllStudents: true,
    canViewAllFreelancers: true,
    canAssignStudents: true,
    canTransferOwnership: true,
    canViewSystemAnalytics: true,
    canManageUsers: true,
    canAccessAdminDashboard: true,
  },
  freelancer: {
    canViewAllStudents: false,
    canViewAllFreelancers: false,
    canAssignStudents: false,
    canTransferOwnership: false,
    canViewSystemAnalytics: false,
    canManageUsers: false,
    canAccessAdminDashboard: false,
  },
};
