import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import {
  ApiEnvelope,
  ApiListResponse,
  BackendEnvelope,
  BackendUserListData,
  CreateUserPayload,
  PasswordChangeRequestDTO,
  PasswordChangeRequestPayload,
  PrivilegedPasswordPayload,
  ResolvePasswordChangeRequestPayload,
  UpdateUserPayload,
  UserDTO,
  UserListResponse,
  UserMeta,
  UserQuery,
  UserStatus,
} from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserApi {
  private readonly http = inject(HttpClient);

  private resolveApiUrl(tenantId?: string | null): string {
    if (tenantId) {
      return `/api/tenants/${tenantId}/users`;
    }

    return '/api/users';
  }

  private readonly mockUsers: UserDTO[] = [
    {
      id: 'u-1001',
      email: 'alex.estrada@example.com',
      fullName: 'Alex Estrada',
      role: 'admin',
      status: 'active',
      phone: '+573001112233',
      locale: 'es-CO',
      lastLoginAt: '2024-11-02T10:12:00.000Z',
      createdAt: '2024-10-01T09:00:00.000Z',
      updatedAt: '2024-12-15T12:00:00.000Z',
      updatedByName: 'Super Admin',
    },
    {
      id: 'u-1002',
      email: 'maria.suarez@example.com',
      fullName: 'María Suarez',
      role: 'operator',
      status: 'invited',
      phone: '+573001991188',
      locale: 'es-CO',
      lastLoginAt: null,
      createdAt: '2024-12-20T08:00:00.000Z',
      updatedAt: '2024-12-20T08:00:00.000Z',
      updatedByName: null,
    },
    {
      id: 'u-1003',
      email: 'lina.rojas@example.com',
      fullName: 'Lina Rojas',
      role: 'viewer',
      status: 'active',
      phone: '+573001122554',
      locale: 'es-CO',
      lastLoginAt: '2025-01-10T14:25:00.000Z',
      createdAt: '2024-12-05T10:00:00.000Z',
      updatedAt: '2025-01-10T14:25:00.000Z',
      updatedByName: 'Alex Estrada',
    },
    {
      id: 'u-1004',
      email: 'jorge.navarro@example.com',
      fullName: 'Jorge Navarro',
      role: 'operator',
      status: 'suspended',
      phone: '+573008880000',
      locale: 'es-CO',
      lastLoginAt: '2024-12-18T16:10:00.000Z',
      createdAt: '2024-11-12T08:30:00.000Z',
      updatedAt: '2024-12-19T09:00:00.000Z',
      updatedByName: 'María Suarez',
    },
    {
      id: 'u-1005',
      email: 'catalina.vera@example.com',
      fullName: 'Catalina Vera',
      role: 'viewer',
      status: 'active',
      phone: '+573004442233',
      locale: 'es-CO',
      lastLoginAt: '2025-01-07T09:40:00.000Z',
      createdAt: '2024-12-25T07:00:00.000Z',
      updatedAt: '2025-01-07T09:40:00.000Z',
      updatedByName: null,
    }
  ];

  list(query: UserQuery, options?: { tenantId?: string | null; globalSuperAdminOnly?: boolean }): Observable<UserListResponse> {
    const apiUrl = this.resolveApiUrl(options?.tenantId);
    const params = this.buildParams(query, options?.globalSuperAdminOnly ?? false);
    return this.http
      .get<BackendEnvelope<BackendUserListData>>(apiUrl, { params })
      .pipe(
        map((response) => this.normalizeListResponse(response)),
        catchError(() => this.mockList(query))
      );
  }

  getById(id: string, tenantId?: string | null): Observable<ApiEnvelope<UserDTO>> {
    const apiUrl = this.resolveApiUrl(tenantId);
    return this.http
      .get<BackendEnvelope<UserDTO>>(`${apiUrl}/${id}`)
      .pipe(
        map((response) => ({ data: this.normalizeUser(response.data) })),
        catchError(() => this.mockGet(id))
      );
  }

  create(payload: CreateUserPayload, tenantId?: string | null): Observable<ApiEnvelope<UserDTO>> {
    const apiUrl = this.resolveApiUrl(tenantId);
    return this.http
      .post<BackendEnvelope<UserDTO>>(apiUrl, payload)
      .pipe(
        map((response) => ({ data: this.normalizeUser(response.data) })),
        catchError(() => this.mockCreate(payload))
      );
  }

  update(id: string, payload: UpdateUserPayload, tenantId?: string | null): Observable<ApiEnvelope<UserDTO>> {
    const apiUrl = this.resolveApiUrl(tenantId);
    return this.http
      .patch<BackendEnvelope<UserDTO>>(`${apiUrl}/${id}`, payload)
      .pipe(
        map((response) => ({ data: this.normalizeUser(response.data) })),
        catchError(() => this.mockUpdate(id, payload))
      );
  }

changeStatus(id: string, status: UserStatus, tenantId?: string | null): Observable<ApiEnvelope<UserDTO>> {
    const apiUrl = this.resolveApiUrl(tenantId);
    return this.http
      .patch<BackendEnvelope<UserDTO>>(`${apiUrl}/${id}`, { status })
      .pipe(
        map((response) => ({ data: this.normalizeUser(response.data) })),
        catchError(() => this.mockUpdate(id, { status }))
      );
  }

  privilegedChangePassword(id: string, payload: PrivilegedPasswordPayload, tenantId?: string | null): Observable<ApiEnvelope<UserDTO>> {
    const apiUrl = this.resolveApiUrl(tenantId);
    return this.http
      .post<BackendEnvelope<UserDTO>>(`${apiUrl}/${id}/change-password`, payload)
      .pipe(
        map((response) => ({ data: this.normalizeUser(response.data) })),
        catchError(() => this.mockUpdate(id, {}))
      );
  }

  addPasswordChangeRequest(
    payload: PasswordChangeRequestPayload,
    tenantId?: string | null
  ): Observable<ApiEnvelope<PasswordChangeRequestDTO>> {
    const apiUrl = this.resolveApiUrl(tenantId);
    return this.http
      .post<BackendEnvelope<PasswordChangeRequestDTO>>(`${apiUrl}/password-change-requests`, payload)
      .pipe(
        map((response) => ({ data: response.data })),
        catchError(() => this.mockAddPasswordChangeRequest(payload))
      );
  }

  listPasswordChangeRequests(options?: {
    tenantId?: string | null;
    status?: string;
  }): Observable<ApiListResponse<PasswordChangeRequestDTO>> {
    const apiUrl = this.resolveApiUrl(options?.tenantId);
    const params = new HttpParams({
      fromObject: {
        ...(options?.status ? { status: options.status } : {}),
      }
    });
    return this.http
      .get<BackendEnvelope<{ items: PasswordChangeRequestDTO[]; total: number }>>(
        `${apiUrl}/password-change-requests`,
        { params }
      )
      .pipe(
        map((response) => ({
          data: response.data.items ?? [],
          total: response.data.total ?? 0,
        })),
        catchError(() => this.mockListPasswordChangeRequests(options?.status))
      );
  }

  resolvePasswordChangeRequest(
    requestId: string,
    payload: ResolvePasswordChangeRequestPayload,
    tenantId?: string | null
  ): Observable<ApiEnvelope<PasswordChangeRequestDTO>> {
    const apiUrl = this.resolveApiUrl(tenantId);
    return this.http
      .post<BackendEnvelope<PasswordChangeRequestDTO>>(
        `${apiUrl}/password-change-requests/${requestId}/resolve`,
        payload
      )
      .pipe(
        map((response) => ({ data: response.data })),
        catchError(() => this.mockResolvePasswordChangeRequest(requestId, payload))
      );
  }

  private buildParams(query: UserQuery, globalSuperAdminOnly: boolean): HttpParams {
    const role = globalSuperAdminOnly ? 'super-admin' : query.role;

    const params = new HttpParams({
      fromObject: {
        ...(query.search ? { search: query.search } : {}),
        ...(role ? { role } : {}),
        ...(query.status ? { status: query.status } : {}),
        page: String(query.page ?? 1),
        limit: String(query.pageSize ?? 10),
      }
    });

    return params;
  }

  private mockList(query: UserQuery): Observable<UserListResponse> {
    const term = (query.search ?? '').toLowerCase();
    const role = query.role ?? '';
    const status = query.status ?? '';
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const filtered = this.mockUsers.filter(user => {
      const matchesTerm = term
        ? user.fullName.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
        : true;
      const matchesRole = role ? user.role === role : true;
      const matchesStatus = status ? user.status === status : true;
      return matchesTerm && matchesRole && matchesStatus;
    });

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = filtered.slice(start, end);

    const meta: UserMeta = {
      page,
      pageSize,
      total: filtered.length,
    };

    return of({ data, meta });
  }

  private mockGet(id: string): Observable<ApiEnvelope<UserDTO>> {
    const found = this.mockUsers.find(user => user.id === id);
    if (!found) {
      return of({ data: this.mockUsers[0] });
    }
    return of({ data: found });
  }

  private mockCreate(payload: CreateUserPayload): Observable<ApiEnvelope<UserDTO>> {
    const now = new Date().toISOString();
    const newUser: UserDTO = {
      id: `u-${Date.now()}`,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      status: payload.status ?? 'active',
      phone: payload.phone ?? null,
      locale: payload.locale ?? null,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.mockUsers.unshift(newUser);
    return of({ data: newUser });
  }

  private mockUpdate(id: string, payload: UpdateUserPayload): Observable<ApiEnvelope<UserDTO>> {
    const index = this.mockUsers.findIndex(user => user.id === id);
    if (index === -1) {
      return of({ data: this.mockUsers[0] });
    }

    const now = new Date().toISOString();
    const updated: UserDTO = {
      ...this.mockUsers[index],
      ...payload,
      updatedAt: now,
    };

    this.mockUsers[index] = updated;
    return of({ data: updated });
  }

  private readonly mockPasswordChangeRequests: PasswordChangeRequestDTO[] = [
    {
      id: 'pcr-001',
      targetUserId: 'u-1002',
      targetUserName: 'María Suarez',
      targetUserEmail: 'maria.suarez@example.com',
      requestedById: 'u-1001',
      requestedByName: 'Alex Estrada',
      reason: 'Usuario olvido su contraseña',
      status: 'pending',
      createdAt: '2025-01-15T08:30:00.000Z',
    },
    {
      id: 'pcr-002',
      targetUserId: 'u-1004',
      targetUserName: 'Jorge Navarro',
      targetUserEmail: 'jorge.navarro@example.com',
      requestedById: 'u-1001',
      requestedByName: 'Alex Estrada',
      reason: undefined,
      status: 'pending',
      createdAt: '2025-01-14T14:00:00.000Z',
    },
  ];

  private mockAddPasswordChangeRequest(
    payload: PasswordChangeRequestPayload
  ): Observable<ApiEnvelope<PasswordChangeRequestDTO>> {
    const target = this.mockUsers.find(user => user.id === payload.targetUserId);
    const now = new Date().toISOString();
    const request: PasswordChangeRequestDTO = {
      id: `pcr-${Date.now()}`,
      targetUserId: payload.targetUserId,
      targetUserName: target?.fullName,
      targetUserEmail: target?.email,
      requestedById: 'u-current',
      requestedByName: 'Admin',
      reason: payload.reason,
      status: 'pending',
      createdAt: now,
    };

    this.mockPasswordChangeRequests.unshift(request);
    return of({ data: request });
  }

  private mockListPasswordChangeRequests(
    status?: string
  ): Observable<ApiListResponse<PasswordChangeRequestDTO>> {
    const filtered = status
      ? this.mockPasswordChangeRequests.filter(r => r.status === status)
      : this.mockPasswordChangeRequests;
    return of({ data: filtered, total: filtered.length });
  }

  private mockResolvePasswordChangeRequest(
    requestId: string,
    payload: ResolvePasswordChangeRequestPayload
  ): Observable<ApiEnvelope<PasswordChangeRequestDTO>> {
    const index = this.mockPasswordChangeRequests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return of({ data: this.mockPasswordChangeRequests[0] });
    }

    const resolved: PasswordChangeRequestDTO = {
      ...this.mockPasswordChangeRequests[index],
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    };
    this.mockPasswordChangeRequests[index] = resolved;
    return of({ data: resolved });
  }

  private normalizeListResponse(response: BackendEnvelope<BackendUserListData>): UserListResponse {
    const source = response.data;
    const data = (source.items ?? []).map((user) => this.normalizeUser(user));
    const meta: UserMeta = {
      page: source.page,
      pageSize: source.limit,
      total: source.total,
    };

    return { data, meta };
  }

  private normalizeUser(user: UserDTO): UserDTO {
    const record = user as unknown as { id?: string; _id?: string };
    return {
      ...user,
      id: user.id ?? record._id ?? '',
      phone: user.phone ?? null,
      locale: user.locale ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
      updatedByName: user.updatedByName ?? null,
    };
  }
}
