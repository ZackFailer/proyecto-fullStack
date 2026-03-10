import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import {
  ApiEnvelope,
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
      firstName: 'Alex',
      lastName: 'Estrada',
      role: 'admin',
      status: 'active',
      phone: '+573001112233',
      avatarUrl: null,
      lastLoginAt: '2024-11-02T10:12:00.000Z',
      createdAt: '2024-10-01T09:00:00.000Z',
      updatedAt: '2024-12-15T12:00:00.000Z',
    },
    {
      id: 'u-1002',
      email: 'maria.suarez@example.com',
      firstName: 'María',
      lastName: 'Suarez',
      role: 'manager',
      status: 'pending_invite',
      phone: '+573001991188',
      avatarUrl: null,
      lastLoginAt: null,
      createdAt: '2024-12-20T08:00:00.000Z',
      updatedAt: '2024-12-20T08:00:00.000Z',
    },
    {
      id: 'u-1003',
      email: 'lina.rojas@example.com',
      firstName: 'Lina',
      lastName: 'Rojas',
      role: 'viewer',
      status: 'active',
      phone: '+573001122554',
      avatarUrl: null,
      lastLoginAt: '2025-01-10T14:25:00.000Z',
      createdAt: '2024-12-05T10:00:00.000Z',
      updatedAt: '2025-01-10T14:25:00.000Z',
    },
    {
      id: 'u-1004',
      email: 'jorge.navarro@example.com',
      firstName: 'Jorge',
      lastName: 'Navarro',
      role: 'manager',
      status: 'suspended',
      phone: '+573008880000',
      avatarUrl: null,
      lastLoginAt: '2024-12-18T16:10:00.000Z',
      createdAt: '2024-11-12T08:30:00.000Z',
      updatedAt: '2024-12-19T09:00:00.000Z',
    },
    {
      id: 'u-1005',
      email: 'catalina.vera@example.com',
      firstName: 'Catalina',
      lastName: 'Vera',
      role: 'viewer',
      status: 'active',
      phone: '+573004442233',
      avatarUrl: null,
      lastLoginAt: '2025-01-07T09:40:00.000Z',
      createdAt: '2024-12-25T07:00:00.000Z',
      updatedAt: '2025-01-07T09:40:00.000Z',
    }
  ];

  list(query: UserQuery): Observable<UserListResponse> {
    const params = this.buildParams(query);
    return this.http
      .get<UserListResponse>(this.apiUrl, { params })
      .pipe(catchError(() => this.mockList(query)));
  }

  getById(id: string): Observable<ApiEnvelope<UserDTO>> {
    return this.http
      .get<ApiEnvelope<UserDTO>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(() => this.mockGet(id)));
  }

  create(payload: CreateUserPayload): Observable<ApiEnvelope<UserDTO>> {
    return this.http
      .post<ApiEnvelope<UserDTO>>(this.apiUrl, payload)
      .pipe(catchError(() => this.mockCreate(payload)));
  }

  update(id: string, payload: UpdateUserPayload): Observable<ApiEnvelope<UserDTO>> {
    return this.http
      .patch<ApiEnvelope<UserDTO>>(`${this.apiUrl}/${id}`, payload)
      .pipe(catchError(() => this.mockUpdate(id, payload)));
  }

  changeStatus(id: string, status: UserStatus): Observable<ApiEnvelope<UserDTO>> {
    return this.http
      .patch<ApiEnvelope<UserDTO>>(`${this.apiUrl}/${id}`, { status })
      .pipe(catchError(() => this.mockUpdate(id, { status })));
  }

  private buildParams(query: UserQuery): HttpParams {
    const params = new HttpParams({
      fromObject: {
        ...(query.search ? { search: query.search } : {}),
        ...(query.role ? { role: query.role } : {}),
        ...(query.status ? { status: query.status } : {}),
        page: String(query.page ?? 1),
        pageSize: String(query.pageSize ?? 10),
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
        ? `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
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
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      status: payload.status ?? 'active',
      phone: payload.phone ?? null,
      avatarUrl: payload.avatarUrl ?? null,
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
}
