import { Injectable } from '@angular/core';
import { Account, Transaction, Card, Notification, Beneficiary } from '../models/bank.models';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private accounts: Account[] = [
    { id: '1', accountNumber: '**** 4582', type: 'Checking', balance: 12450.75, currency: 'USD' },
    { id: '2', accountNumber: '**** 9123', type: 'Savings', balance: 45000.00, currency: 'USD' },
    { id: '3', accountNumber: '**** 7731', type: 'Investment', balance: 23780.50, currency: 'USD' }
  ];

  private transactions: Transaction[] = [
    { id: '1',  date: new Date('2025-06-07'), description: 'Salary Deposit',         amount: 5000.00, type: 'credit', category: 'Income',         status: 'completed' },
    { id: '2',  date: new Date('2025-06-07'), description: 'Amazon.com',              amount: 89.99,   type: 'debit',  category: 'Shopping',       status: 'completed' },
    { id: '3',  date: new Date('2025-06-06'), description: 'Starbucks Coffee',        amount: 5.50,    type: 'debit',  category: 'Food',            status: 'completed' },
    { id: '4',  date: new Date('2025-06-06'), description: 'Netflix Subscription',    amount: 15.99,   type: 'debit',  category: 'Entertainment',   status: 'pending'   },
    { id: '5',  date: new Date('2025-06-05'), description: 'Freelance Payment',       amount: 1200.00, type: 'credit', category: 'Income',         status: 'completed' },
    { id: '6',  date: new Date('2025-06-05'), description: 'Uber Ride',               amount: 18.40,   type: 'debit',  category: 'Transport',       status: 'completed' },
    { id: '7',  date: new Date('2025-06-04'), description: 'Electric Bill',           amount: 120.00,  type: 'debit',  category: 'Bills',           status: 'completed' },
    { id: '8',  date: new Date('2025-06-04'), description: 'Account Transfer',        amount: 2000.00, type: 'credit', category: 'Transfer',       status: 'completed' },
    { id: '9',  date: new Date('2025-06-03'), description: 'McDonald\'s',             amount: 12.75,   type: 'debit',  category: 'Food',            status: 'completed' },
    { id: '10', date: new Date('2025-06-03'), description: 'Spotify Premium',         amount: 9.99,    type: 'debit',  category: 'Entertainment',   status: 'completed' },
    { id: '11', date: new Date('2025-06-02'), description: 'Dividend Income',         amount: 340.00,  type: 'credit', category: 'Income',         status: 'completed' },
    { id: '12', date: new Date('2025-06-02'), description: 'Grocery Store',           amount: 67.30,   type: 'debit',  category: 'Shopping',       status: 'completed' },
    { id: '13', date: new Date('2025-06-01'), description: 'Internet Bill',           amount: 59.99,   type: 'debit',  category: 'Bills',           status: 'failed'    },
    { id: '14', date: new Date('2025-05-31'), description: 'Gym Membership',          amount: 45.00,   type: 'debit',  category: 'Entertainment',   status: 'completed' },
    { id: '15', date: new Date('2025-05-30'), description: 'Savings Transfer',        amount: 500.00,  type: 'debit',  category: 'Transfer',       status: 'completed' }
  ];

  private cardsSubject = new BehaviorSubject<Card[]>([
    { id: '1', cardNumber: '**** **** **** 4582', expiryDate: '12/26', type: 'Visa',       status: 'active',  limit: 5000  },
    { id: '2', cardNumber: '**** **** **** 9123', expiryDate: '08/25', type: 'Mastercard', status: 'active',  limit: 10000 },
    { id: '3', cardNumber: '**** **** **** 7731', expiryDate: '03/27', type: 'Visa',       status: 'blocked', limit: 3000  }
  ]);

  private beneficiaries: Beneficiary[] = [
    { id: 'b1', name: 'John Smith',    accountNumber: '123456789', bank: 'Chase Bank'       },
    { id: 'b2', name: 'Jane Doe',      accountNumber: '987654321', bank: 'Bank of America'  },
    { id: 'b3', name: 'Robert Brown',  accountNumber: '456789123', bank: 'Wells Fargo'      },
    { id: 'b4', name: 'Emily Davis',   accountNumber: '321654987', bank: 'Citibank'         }
  ];

  private notifications: Notification[] = [
    { id: 'n1', message: 'Salary of $5,000 credited to your Checking account',            type: 'success', date: new Date('2025-06-07T09:00:00'), read: false },
    { id: 'n2', message: 'Netflix subscription of $15.99 is pending processing',          type: 'info',    date: new Date('2025-06-06T18:30:00'), read: false },
    { id: 'n3', message: 'Card ending in 4582 used at Amazon.com for $89.99',             type: 'info',    date: new Date('2025-06-07T11:00:00'), read: false },
    { id: 'n4', message: 'Internet Bill payment of $59.99 failed — please retry',         type: 'warning', date: new Date('2025-06-01T08:00:00'), read: false },
    { id: 'n5', message: 'Card ending in 7731 has been blocked',                          type: 'warning', date: new Date('2025-05-30T14:00:00'), read: true  }
  ];

  getAccounts(): Observable<Account[]> {
    return of(this.accounts).pipe(delay(400));
  }

  getTransactions(): Observable<Transaction[]> {
    return of([...this.transactions].sort((a, b) => b.date.getTime() - a.date.getTime())).pipe(delay(400));
  }

  getCards(): Observable<Card[]> {
    return this.cardsSubject.asObservable();
  }

  getBeneficiaries(): Observable<Beneficiary[]> {
    return of(this.beneficiaries);
  }

  getNotifications(): Observable<Notification[]> {
    return of(this.notifications);
  }

  toggleCardStatus(cardId: string): Observable<Card[]> {
    const cards = this.cardsSubject.value.map(card => {
      if (card.id === cardId) {
        return { ...card, status: card.status === 'active' ? 'blocked' as const : 'active' as const };
      }
      return card;
    });
    this.cardsSubject.next(cards);
    return of(cards);
  }

  transferFunds(from: string, to: string, amount: number): Observable<boolean> {
    const newTx: Transaction = {
      id: String(Date.now()),
      date: new Date(),
      description: `Transfer to ${to}`,
      amount,
      type: 'debit',
      category: 'Transfer',
      status: 'completed'
    };
    this.transactions.unshift(newTx);
    return of(true).pipe(delay(1200));
  }

  markNotificationRead(id: string): void {
    const n = this.notifications.find(n => n.id === id);
    if (n) n.read = true;
  }

  markAllNotificationsRead(): void {
    this.notifications.forEach(n => (n.read = true));
  }
}
