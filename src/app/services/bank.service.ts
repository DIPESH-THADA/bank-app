import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Account, Transaction, Card, Notification, Beneficiary } from '../models/bank.models';
@Injectable({ providedIn: 'root' })
export class BankService {
  private http = inject(HttpClient);
  getAccounts() {
    return this.http.get<Account[]>('/api/accounts');
  }
  getTransactions() {
    return this.http
      .get<Transaction[]>('/api/transactions')
      .pipe(map((list) => list.map((t) => ({ ...t, date: new Date(t.date) }))));
  }
  getCards() {
    return this.http.get<Card[]>('/api/cards');
  }
  getBeneficiaries() {
    return this.http.get<Beneficiary[]>('/api/beneficiaries');
  }
  getNotifications() {
    return this.http.get<Notification[]>('/api/notifications');
  }
  toggleCardStatus(id: string, status: Card['status']) {
    return this.http.patch<Card[]>(`/api/cards/${id}`, { status });
  }
  transferFunds(from: string, to: string, amount: number, description: string, key: string) {
    return this.http.post<{ reference: string }>('/api/transfers', {
      from,
      to,
      amount,
      description,
      key,
      confirmed: true,
    });
  }
  markNotificationRead(id: string) {
    return this.http.post('/api/notifications/read', { id });
  }
  markAllNotificationsRead() {
    return this.http.post('/api/notifications/read', {});
  }
}
