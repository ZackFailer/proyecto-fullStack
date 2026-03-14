export type UserRole = 'super-admin' | 'admin' | 'operator' | 'viewer';
export type UserStatus = 'active' | 'invited' | 'suspended' | 'deleted';

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  clientId?: string | null;
  phone?: string | null;
  locale?: string | null;
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
  fullName: string;
  role: UserRole;
  phone?: string | null;
  status?: UserStatus;
  locale?: string | null;
}

export interface UpdateUserPayload {
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string | null;
  locale?: string | null;
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

export interface BackendEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface BackendUserListData {
  items: UserDTO[];
  page: number;
  limit: number;
  total: number;
}
