import { Injectable } from '@angular/core';
import { User } from '../models/bank.models';
import { Observable, of, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  login(email: string, password: string): Observable<boolean> {
    if (email && password) {
      const mockUser: User = {
        id: '1',
        name: 'John Doe',
        email: email,
        avatar: 'https://ui-avatars.com/api/?name=John+Doe'
      };
      this.currentUserSubject.next(mockUser);
      return of(true);
    }
    return of(false);
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}
