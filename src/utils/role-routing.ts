import type { UserRole } from '../types/auth';

export function routeForRole(role: UserRole) {
  if (role === 'CAREGIVER') return '/(caregiver)' as const;
  if (role === 'CARE_MANAGER') return '/(manager)' as const;
  if (role === 'RESPONSIBLE') return '/(responsible)' as const;
  return '/(patient)' as const;
}
