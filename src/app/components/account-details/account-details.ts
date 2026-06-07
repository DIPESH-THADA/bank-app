import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankService } from '../../services/bank.service';
import { Account, Card } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-account-details',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './account-details.html',
  styleUrl: './account-details.scss',
})
export class AccountDetailsComponent implements OnInit {
  accounts: Account[] = [];
  cards: Card[] = [];
  sidebarOpen: boolean = true;
  loadingAccounts: boolean = true;
  loadingCards: boolean = true;
  togglingCardId: string | null = null;
  toastMessage: string = '';
  toastType: 'success' | 'warning' = 'success';
  private toastTimer: any = null;

  constructor(private bankService: BankService) {}

  ngOnInit() {
    this.bankService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
      this.loadingAccounts = false;
    });

    this.bankService.getCards().subscribe(cards => {
      this.cards = cards;
      this.loadingCards = false;
    });
  }

  toggleCard(card: Card) {
    if (this.togglingCardId) return;
    this.togglingCardId = card.id;

    this.bankService.toggleCardStatus(card.id).subscribe(updatedCards => {
      this.cards = updatedCards;
      this.togglingCardId = null;
      const updated = updatedCards.find(c => c.id === card.id);
      if (updated) {
        const action = updated.status === 'active' ? 'activated' : 'blocked';
        this.showToast(`Card ending in ${card.cardNumber.slice(-4)} has been ${action}.`,
          updated.status === 'active' ? 'success' : 'warning');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'warning') {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  getAccountTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Checking':   '🏦',
      'Savings':    '💰',
      'Investment': '📈'
    };
    return icons[type] ?? '💳';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
