import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankService } from '../../services/bank.service';
import { Transaction } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  selectedFilter: string = 'all';
  selectedCategory: string = 'all';
  searchQuery: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  sidebarOpen: boolean = true;
  loading: boolean = true;

  readonly categories = ['all', 'Shopping', 'Food', 'Entertainment', 'Income', 'Transfer', 'Bills', 'Transport'];

  constructor(private bankService: BankService) {}

  ngOnInit() {
    this.bankService.getTransactions().subscribe(transactions => {
      this.transactions = transactions;
      this.loading = false;
      this.applyFilters();
    });
  }

  applyFilters() {
    let result = [...this.transactions];

    if (this.selectedFilter !== 'all') {
      result = result.filter(t => t.type === this.selectedFilter);
    }

    if (this.selectedCategory !== 'all') {
      result = result.filter(t => t.category === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      );
    }

    if (this.dateFrom) {
      result = result.filter(t => new Date(t.date) >= new Date(this.dateFrom));
    }
    if (this.dateTo) {
      result = result.filter(t => new Date(t.date) <= new Date(this.dateTo + 'T23:59:59'));
    }

    this.filteredTransactions = result;
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return (
      this.selectedFilter !== 'all' ||
      this.selectedCategory !== 'all' ||
      this.searchQuery.trim() !== '' ||
      this.dateFrom !== '' ||
      this.dateTo !== ''
    );
  }

  clearFilters() {
    this.selectedFilter = 'all';
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
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
