export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  type: 'Savings' | 'Checking' | 'Investment';
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Card {
  id: string;
  cardNumber: string;
  expiryDate: string;
  type: 'Visa' | 'Mastercard';
  status: 'active' | 'blocked';
  limit: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  date: Date;
  read: boolean;
}

export interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bank: string;
}
