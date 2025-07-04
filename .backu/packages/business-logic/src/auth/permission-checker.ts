// CivicSense Permission Checker
// Role-based access control for civic education features

export type UserRole = 'guest' | 'user' | 'premium' | 'educator' | 'admin' | 'moderator';

export interface UserPermissions {
  canTakeQuiz: boolean;
  canAccessPremiumContent: boolean;
  canCreateContent: boolean;
  canModerateContent: boolean;
  canAccessAnalytics: boolean;
  canManageUsers: boolean;
  canAccessMultiplayer: boolean;
  canExportData: boolean;
}

export class PermissionChecker {
  private rolePermissions: Record<UserRole, UserPermissions> = {
    guest: {
      canTakeQuiz: true,
      canAccessPremiumContent: false,
      canCreateContent: false,
      canModerateContent: false,
      canAccessAnalytics: false,
      canManageUsers: false,
      canAccessMultiplayer: false,
      canExportData: false,
    },
    user: {
      canTakeQuiz: true,
      canAccessPremiumContent: false,
      canCreateContent: false,
      canModerateContent: false,
      canAccessAnalytics: false,
      canManageUsers: false,
      canAccessMultiplayer: true,
      canExportData: false,
    },
    premium: {
      canTakeQuiz: true,
      canAccessPremiumContent: true,
      canCreateContent: false,
      canModerateContent: false,
      canAccessAnalytics: true,
      canManageUsers: false,
      canAccessMultiplayer: true,
      canExportData: true,
    },
    educator: {
      canTakeQuiz: true,
      canAccessPremiumContent: true,
      canCreateContent: true,
      canModerateContent: false,
      canAccessAnalytics: true,
      canManageUsers: false,
      canAccessMultiplayer: true,
      canExportData: true,
    },
    moderator: {
      canTakeQuiz: true,
      canAccessPremiumContent: true,
      canCreateContent: true,
      canModerateContent: true,
      canAccessAnalytics: true,
      canManageUsers: false,
      canAccessMultiplayer: true,
      canExportData: true,
    },
    admin: {
      canTakeQuiz: true,
      canAccessPremiumContent: true,
      canCreateContent: true,
      canModerateContent: true,
      canAccessAnalytics: true,
      canManageUsers: true,
      canAccessMultiplayer: true,
      canExportData: true,
    },
  };

  getUserPermissions(role: UserRole): UserPermissions {
    return this.rolePermissions[role];
  }

  hasPermission(role: UserRole, permission: keyof UserPermissions): boolean {
    return this.getUserPermissions(role)[permission];
  }

  canAccessFeature(role: UserRole, feature: keyof UserPermissions): boolean {
    return this.hasPermission(role, feature);
  }

  canAccessCivicContent(role: UserRole, contentType: 'basic' | 'premium' | 'admin'): boolean {
    switch (contentType) {
      case 'basic':
        return true; // Everyone can access basic civic content
      case 'premium':
        return this.hasPermission(role, 'canAccessPremiumContent');
      case 'admin':
        return role === 'admin';
      default:
        return false;
    }
  }

  canParticipateInMultiplayer(role: UserRole): boolean {
    return this.hasPermission(role, 'canAccessMultiplayer');
  }

  canCreateQuiz(role: UserRole): boolean {
    return this.hasPermission(role, 'canCreateContent');
  }

  canViewAnalytics(role: UserRole): boolean {
    return this.hasPermission(role, 'canAccessAnalytics');
  }
} 