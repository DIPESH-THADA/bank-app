import { ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BankService } from '../../services/bank.service';
import { apiError } from '../../services/api';
import { Account, Beneficiary } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fund-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './fund-transfer.html',
  styleUrl: './fund-transfer.scss',
})
export class FundTransferComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private bankService = inject(BankService);
  private destroyRef = inject(DestroyRef);
  form = inject(FormBuilder).nonNullable.group({
    fromAccount: ['', Validators.required],
    toAccount: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01), Validators.max(50000)]],
    description: ['', Validators.maxLength(100)],
  });
  accounts: Account[] = [];
  beneficiaries: Beneficiary[] = [];
  loading = false;
  success = false;
  error = '';
  sidebarOpen = true;
  confirming = false;
  reference = '';
  private key = '';
  get fromAccount() {
    return this.form.controls.fromAccount.value;
  }
  get toAccount() {
    return this.form.controls.toAccount.value;
  }
  get amount() {
    return this.form.controls.amount.value;
  }
  get description() {
    return this.form.controls.description.value;
  }
  get selectedAccount() {
    return this.accounts.find((a) => a.id === this.fromAccount);
  }
  get selectedBeneficiary() {
    return this.beneficiaries.find((b) => b.id === this.toAccount);
  }
  ngOnInit() {
    this.loadAccounts();
    this.bankService
      .getBeneficiaries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (b) => {
          this.cdr.markForCheck();
          this.beneficiaries = b;
        },
        error: (e) => {
          this.cdr.markForCheck();
          this.error = apiError(e);
        },
      });
  }
  loadAccounts() {
    this.bankService
      .getAccounts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (a) => {
          this.cdr.markForCheck();
          this.accounts = a;
        },
        error: (e) => {
          this.cdr.markForCheck();
          this.error = apiError(e);
        },
      });
  }
  review() {
    this.error = '';
    if (
      this.form.invalid ||
      !Number.isFinite(this.amount) ||
      Math.abs(this.amount * 100 - Math.round(this.amount * 100)) > 0.000001
    ) {
      this.error = 'Choose accounts and enter $0.01 to $50,000 with at most two decimal places.';
      return;
    }
    if (!this.selectedAccount || !this.selectedBeneficiary) {
      this.error = 'Choose a valid source and recipient.';
      return;
    }
    if (this.amount > this.selectedAccount.balance) {
      this.error = 'Insufficient available balance.';
      return;
    }
    this.key = crypto.randomUUID();
    this.confirming = true;
  }
  cancelReview() {
    if (!this.loading) this.confirming = false;
  }
  transfer() {
    if (this.loading || !this.confirming) return;
    this.loading = true;
    this.error = '';
    this.bankService
      .transferFunds(this.fromAccount, this.toAccount, this.amount, this.description, this.key)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.cdr.markForCheck();
          this.reference = r.reference;
          this.loading = false;
          this.confirming = false;
          this.success = true;
          this.loadAccounts();
        },
        error: (e) => {
          this.cdr.markForCheck();
          this.loading = false;
          this.error = apiError(e);
        },
      });
  }
  resetForm() {
    this.form.reset();
    this.success = false;
    this.confirming = false;
    this.error = '';
    this.reference = '';
  }
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
