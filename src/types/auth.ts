export type UserRole = 'PATIENT' | 'CAREGIVER' | 'CARE_MANAGER' | 'RESPONSIBLE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
  role: UserRole;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
