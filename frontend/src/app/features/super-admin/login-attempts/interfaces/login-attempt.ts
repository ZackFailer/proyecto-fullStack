export type LoginAttemptReason = 'missing_fields' | 'invalid_credentials' | 'inactive_user' | 'success';

export interface LoginAttemptDTO {
  id: string;
  email: string;
  userId: string | null;
  clientId: string | null;
  success: boolean;
  reason: LoginAttemptReason;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface LoginAttemptListData {
  items: LoginAttemptDTO[];
  total: number;
}

export interface BackendEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginAttemptFilters {
  email: string;
  success: '' | 'true' | 'false';
  limit: number;
}
