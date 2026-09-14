import { Injectable, computed, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Notification } from '../models/bank.models';
import { BankService } from './bank.service';
import { AuthService } from './auth.service';
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private bankService = inject(BankService);
  private destroyRef = inject(DestroyRef);
  private _notifications = signal<Notification[]>([]);
  notifications = this._notifications.asReadonly();
  unreadCount = computed(() => this._notifications().filter((n) => !n.read).length);
  error = signal('');
  constructor() {
    inject(AuthService)
      .currentUser$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this._notifications.set([]);
        if (user) this.refresh();
      });
  }
  refresh() {
    this.bankService.getNotifications().subscribe({
      next: (n) => this._notifications.set(n),
      error: () => this.error.set('Could not load notifications.'),
    });
  }
  markRead(id: string) {
    this.bankService.markNotificationRead(id).subscribe({
      next: () => this.refresh(),
      error: () => this.error.set('Could not mark notification read.'),
    });
  }
  markAllRead() {
    this.bankService.markAllNotificationsRead().subscribe({
      next: () => this.refresh(),
      error: () => this.error.set('Could not mark notifications read.'),
    });
  }
}
