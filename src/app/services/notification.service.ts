import { Injectable, computed, signal } from '@angular/core';
import { Notification } from '../models/bank.models';
import { BankService } from './bank.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = signal<Notification[]>([]);

  notifications = this._notifications.asReadonly();

  unreadCount = computed(() => this._notifications().filter(n => !n.read).length);

  constructor(private bankService: BankService) {
    this.bankService.getNotifications().subscribe(notifications => {
      this._notifications.set(notifications);
    });
  }

  markRead(id: string): void {
    this._notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    this.bankService.markNotificationRead(id);
  }

  markAllRead(): void {
    this._notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.bankService.markAllNotificationsRead();
  }
}
