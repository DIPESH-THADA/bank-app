import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankService } from '../../services/bank.service';
import { Beneficiary } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-fund-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './fund-transfer.html',
  styleUrl: './fund-transfer.scss',
})
export class FundTransferComponent implements OnInit {
  fromAccount: string = '';
  toAccount: string = '';
  amount: number = 0;
  description: string = '';
  loading: boolean = false;
  success: boolean = false;
  error: string = '';
  sidebarOpen: boolean = true;
  confirming: boolean = false;
  beneficiaries: Beneficiary[] = [];

  constructor(private bankService: BankService) {}

  ngOnInit() {
    this.bankService.getBeneficiaries().subscribe(b => {
      this.beneficiaries = b;
    });
  }

  get selectedBeneficiary(): Beneficiary | undefined {
    return this.beneficiaries.find(b => b.id === this.toAccount);
  }

  review() {
    this.error = '';
    if (!this.fromAccount || !this.toAccount || !this.amount || this.amount <= 0) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    if (this.amount > 50000) {
      this.error = 'Transfer limit is $50,000 per transaction.';
      return;
    }
    this.confirming = true;
  }

  cancelReview() {
    this.confirming = false;
  }

  transfer() {
    this.loading = true;
    this.bankService.transferFunds(this.fromAccount, this.toAccount, this.amount).subscribe(
      (result) => {
        this.loading = false;
        this.confirming = false;
        if (result) {
          this.success = true;
          setTimeout(() => this.resetForm(), 4000);
        } else {
          this.error = 'Transfer failed. Please try again.';
        }
      }
    );
  }

  resetForm() {
    this.fromAccount = '';
    this.toAccount = '';
    this.amount = 0;
    this.description = '';
    this.success = false;
    this.confirming = false;
    this.error = '';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
