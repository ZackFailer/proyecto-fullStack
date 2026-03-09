export type UserRole = 'admin' | 'manager' | 'viewer';
export type UserStatus = 'active' | 'suspended' | 'pending_invite';

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface UserQuery {
  search: string;
  role: UserRole | '';
  status: UserStatus | '';
  page: number;
  pageSize: number;
}

export interface CreateUserPayload {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string | null;
  status?: UserStatus;
  avatarUrl?: string | null;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface PasswordChangePayload {
  currentPassword?: string;
  newPassword: string;
}

export interface ApiEnvelope<T, M = unknown> {
  data: T;
  meta?: M;
}

export interface UserListResponse extends ApiEnvelope<UserDTO[], UserMeta> {}
