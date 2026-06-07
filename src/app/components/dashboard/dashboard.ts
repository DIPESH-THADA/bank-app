import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BankService } from '../../services/bank.service';
import { AuthService } from '../../services/auth.service';
import { Account, Transaction } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  accounts: Account[] = [];
  recentTransactions: Transaction[] = [];
  currentUser: any = null;
  totalBalance: number = 0;
  sidebarOpen: boolean = true;
  loadingAccounts: boolean = true;
  loadingTransactions: boolean = true;

  constructor(
    private bankService: BankService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.bankService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
      this.totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      this.loadingAccounts = false;
    });

    this.bankService.getTransactions().subscribe(transactions => {
      this.recentTransactions = transactions.slice(0, 5);
      this.loadingTransactions = false;
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Shopping':      '🛍️',
      'Food':          '🍔',
      'Entertainment': '🎬',
      'Income':        '💰',
      'Transfer':      '🔄',
      'Bills':         '📄',
      'Transport':     '🚗'
    };
    return icons[category] ?? '💳';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
