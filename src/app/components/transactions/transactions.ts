import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankService } from '../../services/bank.service';
import { Transaction } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  selectedFilter: string = 'all';
  sidebarOpen: boolean = true;

  constructor(private bankService: BankService) {}

  ngOnInit() {
    this.bankService.getTransactions().subscribe(transactions => {
      this.transactions = transactions;
      this.filterTransactions();
    });
  }

  filterTransactions() {
    if (this.selectedFilter === 'all') {
      this.filteredTransactions = this.transactions;
    } else if (this.selectedFilter === 'credit') {
      this.filteredTransactions = this.transactions.filter(t => t.type === 'credit');
    } else if (this.selectedFilter === 'debit') {
      this.filteredTransactions = this.transactions.filter(t => t.type === 'debit');
    }
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.filterTransactions();
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
