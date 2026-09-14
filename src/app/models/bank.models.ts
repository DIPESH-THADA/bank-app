export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface ProfileUpdate {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  currentPassword: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  type: 'Savings' | 'Checking' | 'Investment';
  balance: number;
  currency: string;
}

export interface Transaction {
  reference?: string;
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
