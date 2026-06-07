import { Injectable } from '@angular/core';
import { Account, Transaction, Card } from '../models/bank.models';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private accounts: Account[] = [
    { id: '1', accountNumber: '**** 4582', type: 'Checking', balance: 12450.75, currency: 'USD' },
    { id: '2', accountNumber: '**** 9123', type: 'Savings', balance: 45000.00, currency: 'USD' }
  ];

  private transactions: Transaction[] = [
    { id: '1', date: new Date(), description: 'Amazon.com', amount: 89.99, type: 'debit', category: 'Shopping', status: 'completed' },
    { id: '2', date: new Date(), description: 'Salary Deposit', amount: 5000.00, type: 'credit', category: 'Income', status: 'completed' },
    { id: '3', date: new Date(), description: 'Starbucks Coffee', amount: 5.50, type: 'debit', category: 'Food', status: 'completed' },
    { id: '4', date: new Date(), description: 'Netflix Subscription', amount: 15.99, type: 'debit', category: 'Entertainment', status: 'pending' }
  ];

  private cards: Card[] = [
    { id: '1', cardNumber: '**** **** **** 4582', expiryDate: '12/26', type: 'Visa', status: 'active', limit: 5000 },
    { id: '2', cardNumber: '**** **** **** 9123', expiryDate: '08/25', type: 'Mastercard', status: 'active', limit: 10000 }
  ];

  getAccounts(): Observable<Account[]> {
    return of(this.accounts);
  }

  getTransactions(): Observable<Transaction[]> {
    return of(this.transactions);
  }

  getCards(): Observable<Card[]> {
    return of(this.cards);
  }

  transferFunds(from: string, to: string, amount: number): Observable<boolean> {
    console.log(`Transferring ${amount} from ${from} to ${to}`);
    return of(true);
  }
}
