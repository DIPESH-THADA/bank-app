import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';
import { User, ProfileUpdate } from '../models/bank.models';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  login(email: string, password: string) {
    return this.http.post<User>('/api/auth/login', { email, password }).pipe(
      tap((user) => this.currentUserSubject.next(user)),
      map(() => true),
    );
  }
  register(name: string, email: string, password: string) {
    return this.http.post<{ verificationToken: string; message: string }>('/api/auth/register', {
      name,
      email,
      password,
    });
  }
  verify(token: string) {
    return this.http.post('/api/auth/verify', { token });
  }
  restoreSession() {
    return this.http.get<User>('/api/auth/me').pipe(
      tap((user) => this.currentUserSubject.next(user)),
      map(() => true),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(false);
      }),
    );
  }
  logout() {
    return this.http
      .post('/api/auth/logout', {})
      .pipe(tap(() => this.currentUserSubject.next(null)));
  }
  isLoggedIn() {
    return !!this.currentUserSubject.value;
  }
  updateProfile(profile: ProfileUpdate) {
    return this.http
      .patch<User>('/api/profile', profile)
      .pipe(tap((user) => this.currentUserSubject.next(user)));
  }
}
