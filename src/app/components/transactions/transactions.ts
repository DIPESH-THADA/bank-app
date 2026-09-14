import { ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { apiError } from '../../services/api';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankService } from '../../services/bank.service';
import { Transaction } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class TransactionsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  selectedFilter: string = 'all';
  selectedCategory: string = 'all';
  searchQuery: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  error = '';
  sidebarOpen: boolean = true;
  loading: boolean = true;

  selectedStatus = 'all';
  minAmount: number | null = null;
  maxAmount: number | null = null;
  page = 1;
  readonly pageSize = 10;
  selectedTransaction: Transaction | null = null;
  get pageCount() {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize));
  }
  get pageTransactions() {
    return this.filteredTransactions.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize,
    );
  }
  exportCsv() {
    const escape = (value: unknown) =>
      '"' +
      String(value)
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""') +
      '"';
    const rows = [
      ['Date', 'Description', 'Amount (USD)', 'Type', 'Category', 'Status', 'Reference'],
      ...this.filteredTransactions.map((t) => [
        new Date(t.date).toISOString(),
        t.description,
        t.amount,
        t.type,
        t.category,
        t.status,
        t.reference || t.id,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escape).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rastriya-banijya-bank-statement.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  printReceipt() {
    window.print();
  }

  readonly categories = [
    'all',
    'Shopping',
    'Food',
    'Entertainment',
    'Income',
    'Transfer',
    'Bills',
    'Transport',
  ];

  constructor(private bankService: BankService) {}

  ngOnInit() {
    this.bankService.getTransactions().subscribe({
      next: (transactions) => {
        this.cdr.markForCheck();
        this.transactions = transactions;
        this.loading = false;
        this.applyFilters();
      },
      error: (e) => {
        this.cdr.markForCheck();
        this.loading = false;
        this.error = apiError(e);
      },
    });
  }

  applyFilters() {
    let result = [...this.transactions];

    if (this.selectedFilter !== 'all') {
      result = result.filter((t) => t.type === this.selectedFilter);
    }

    if (this.selectedCategory !== 'all') {
      result = result.filter((t) => t.category === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
      );
    }

    if (this.dateFrom) {
      result = result.filter((t) => new Date(t.date) >= new Date(this.dateFrom));
    }
    if (this.dateTo) {
      result = result.filter((t) => new Date(t.date) <= new Date(this.dateTo + 'T23:59:59'));
    }

    if (this.selectedStatus !== 'all')
      result = result.filter((t) => t.status === this.selectedStatus);
    if (this.minAmount !== null) result = result.filter((t) => t.amount >= this.minAmount!);
    if (this.maxAmount !== null) result = result.filter((t) => t.amount <= this.maxAmount!);
    this.page = 1;
    this.filteredTransactions = result;
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return (
      this.selectedStatus !== 'all' ||
      this.minAmount !== null ||
      this.maxAmount !== null ||
      this.selectedFilter !== 'all' ||
      this.selectedCategory !== 'all' ||
      this.searchQuery.trim() !== '' ||
      this.dateFrom !== '' ||
      this.dateTo !== ''
    );
  }

  clearFilters() {
    this.selectedStatus = 'all';
    this.minAmount = null;
    this.maxAmount = null;
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
