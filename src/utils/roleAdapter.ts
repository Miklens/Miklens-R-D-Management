// Centralized Role & Permission Adapter
// Maps Trial Manager roles (ADMIN, DEVELOPER, USER, VIEWER) seamlessly into R&D Management roles (Admin, Scientist, Management)

export type TrialManagerRole = 'ADMIN' | 'DEVELOPER' | 'USER' | 'VIEWER' | string;
export type RndRole = 'Admin' | 'Management' | 'Scientist';

export interface TrialManagerUserPermissions {
  categoryAccess?: Record<string, boolean>;
  tabPermissions?: Record<string, boolean>;
}

/**
 * Robust Role Converter & Permission Resolver
 */
export function mapTrialManagerRoleToRndRole(tmRole?: TrialManagerRole): RndRole {
  if (!tmRole) return 'Scientist';

  const normalized = String(tmRole).toUpperCase().trim();

  switch (normalized) {
    case 'ADMIN':
    case 'DEVELOPER':
      return 'Admin';

    case 'VIEWER':
    case 'MANAGEMENT':
      return 'Management';

    case 'USER':
    case 'SCIENTIST':
    default:
      return 'Scientist';
  }
}

/**
 * Access Control Evaluator
 */
export function canUserPerformAction(
  rndRole: RndRole,
  action: 'MANAGE_USERS' | 'OVERSEE_PORTFOLIO' | 'LOG_DAILY_RESEARCH' | 'CONDUCT_TRIALS'
): boolean {
  switch (action) {
    case 'MANAGE_USERS':
      return rndRole === 'Admin';

    case 'OVERSEE_PORTFOLIO':
      return rndRole === 'Admin' || rndRole === 'Management';

    case 'LOG_DAILY_RESEARCH':
    case 'CONDUCT_TRIALS':
      return true; // All authenticated roles can participate in research

    default:
      return false;
  }
}
