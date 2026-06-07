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

  constructor(private bankService: BankService) {}

  ngOnInit() {
    this.bankService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
    });

    this.bankService.getCards().subscribe(cards => {
      this.cards = cards;
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
