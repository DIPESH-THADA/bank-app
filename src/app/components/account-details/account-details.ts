import { ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { apiError } from '../../services/api';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankService } from '../../services/bank.service';
import { Account, Card } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-account-details',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './account-details.html',
  styleUrl: './account-details.scss',
})
export class AccountDetailsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  accounts: Account[] = [];
  cards: Card[] = [];
  error = '';
  sidebarOpen: boolean = true;
  loadingAccounts: boolean = true;
  loadingCards: boolean = true;
  togglingCardId: string | null = null;
  toastMessage: string = '';
  toastType: 'success' | 'warning' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private bankService: BankService) {}

  ngOnInit() {
    this.bankService.getAccounts().subscribe({
      next: (accounts) => {
        this.cdr.markForCheck();
        this.accounts = accounts;
        this.loadingAccounts = false;
      },
      error: (e) => {
        this.cdr.markForCheck();
        this.loadingAccounts = false;
        this.error = apiError(e);
      },
    });

    this.bankService.getCards().subscribe({
      next: (cards) => {
        this.cdr.markForCheck();
        this.cards = cards;
        this.loadingCards = false;
      },
      error: (e) => {
        this.cdr.markForCheck();
        this.loadingCards = false;
        this.error = apiError(e);
      },
    });
  }

  toggleCard(card: Card) {
    if (this.togglingCardId) return;
    this.togglingCardId = card.id;

    this.bankService
      .toggleCardStatus(card.id, card.status === 'active' ? 'blocked' : 'active')
      .subscribe({
        next: (updatedCards) => {
          this.cdr.markForCheck();
          this.cards = updatedCards;
          this.togglingCardId = null;
          const updated = updatedCards.find((c) => c.id === card.id);
          if (updated) {
            const action = updated.status === 'active' ? 'activated' : 'blocked';
            this.showToast(
              `Card ending in ${card.cardNumber.slice(-4)} has been ${action}.`,
              updated.status === 'active' ? 'success' : 'warning',
            );
          }
        },
        error: (e) => {
          this.cdr.markForCheck();
          this.togglingCardId = null;
          this.error = apiError(e);
        },
      });
  }

  private showToast(message: string, type: 'success' | 'warning') {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 3500);
  }

  getAccountTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      Checking: '🏦',
      Savings: '💰',
      Investment: '📈',
    };
    return icons[type] ?? '💳';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
