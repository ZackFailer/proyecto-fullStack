import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import {
  ApiEnvelope,
  BackendEnvelope,
  BackendUserListData,
  CreateUserPayload,
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
  private readonly apiUrl = '/api/users';

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
    }
  ];

  list(query: UserQuery): Observable<UserListResponse> {
    const params = this.buildParams(query);
    return this.http
      .get<BackendEnvelope<BackendUserListData>>(this.apiUrl, { params })
      .pipe(
        map((response) => this.normalizeListResponse(response)),
        catchError(() => this.mockList(query))
      );
  }

  getById(id: string): Observable<ApiEnvelope<UserDTO>> {
    return this.http
      .get<BackendEnvelope<UserDTO>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => ({ data: this.normalizeUser(response.data) })),
        catchError(() => this.mockGet(id))
      );
  }

  create(payload: CreateUserPayload): Observable<ApiEnvelope<UserDTO>> {
    return this.http
      .post<BackendEnvelope<UserDTO>>(this.apiUrl, payload)
      .pipe(
        map((response) => ({ data: this.normalizeUser(response.data) })),
        catchError(() => this.mockCreate(payload))
      );
  }

  update(id: string, payload: UpdateUserPayload): Observable<ApiEnvelope<UserDTO>> {
    return this.http
      .patch<BackendEnvelope<UserDTO>>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map((response) => ({ data: this.normalizeUser(response.data) })),
        catchError(() => this.mockUpdate(id, payload))
      );
  }

  changeStatus(id: string, status: UserStatus): Observable<ApiEnvelope<UserDTO>> {
    return this.http
      .patch<BackendEnvelope<UserDTO>>(`${this.apiUrl}/${id}`, { status })
      .pipe(
        map((response) => ({ data: this.normalizeUser(response.data) })),
        catchError(() => this.mockUpdate(id, { status }))
      );
  }

  private buildParams(query: UserQuery): HttpParams {
    const params = new HttpParams({
      fromObject: {
        ...(query.search ? { search: query.search } : {}),
        ...(query.role ? { role: query.role } : {}),
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
    };
  }
}
