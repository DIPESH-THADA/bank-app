import { ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { apiError } from '../../services/api';
import { DestroyRef, inject, Component, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BankService } from '../../services/bank.service';
import { AuthService } from '../../services/auth.service';
import { Account, Transaction, User } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  accounts: Account[] = [];
  recentTransactions: Transaction[] = [];
  currentUser: User | null = null;
  balanceVisible = true;
  income = 0;
  spending = 0;
  totalBalance: number = 0;
  error = '';
  sidebarOpen: boolean = true;
  loadingAccounts: boolean = true;
  loadingTransactions: boolean = true;

  constructor(
    private bankService: BankService,
    private authService: AuthService,
  ) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.cdr.markForCheck();
      this.currentUser = user;
    });

    this.bankService.getAccounts().subscribe({
      next: (accounts) => {
        this.cdr.markForCheck();
        this.accounts = accounts;
        this.totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        this.loadingAccounts = false;
      },
      error: (e) => {
        this.cdr.markForCheck();
        this.loadingAccounts = false;
        this.error = apiError(e);
      },
    });

    this.bankService.getTransactions().subscribe({
      next: (transactions) => {
        this.cdr.markForCheck();
        this.income = transactions
          .filter(
            (t) => t.type === 'credit' && t.status === 'completed' && t.category !== 'Transfer',
          )
          .reduce((sum, t) => sum + t.amount, 0);
        this.spending = transactions
          .filter(
            (t) => t.type === 'debit' && t.status === 'completed' && t.category !== 'Transfer',
          )
          .reduce((sum, t) => sum + t.amount, 0);
        this.recentTransactions = transactions.slice(0, 5);
        this.loadingTransactions = false;
      },
      error: (e) => {
        this.cdr.markForCheck();
        this.loadingTransactions = false;
        this.error = apiError(e);
      },
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
      Shopping: '🛍️',
      Food: '🍔',
      Entertainment: '🎬',
      Income: '💰',
      Transfer: '🔄',
      Bills: '📄',
      Transport: '🚗',
    };
    return icons[category] ?? '💳';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
