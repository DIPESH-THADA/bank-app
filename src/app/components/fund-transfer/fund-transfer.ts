import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankService } from '../../services/bank.service';
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
export class FundTransferComponent {
  fromAccount: string = '';
  toAccount: string = '';
  amount: number = 0;
  description: string = '';
  loading: boolean = false;
  success: boolean = false;
  error: string = '';
  sidebarOpen: boolean = true;

  constructor(private bankService: BankService) {}

  transfer() {
    this.error = '';
    this.success = false;

    if (!this.fromAccount || !this.toAccount || this.amount <= 0) {
      this.error = 'Please fill in all fields correctly';
      return;
    }

    this.loading = true;
    this.bankService.transferFunds(this.fromAccount, this.toAccount, this.amount).subscribe(
      (result) => {
        this.loading = false;
        if (result) {
          this.success = true;
          setTimeout(() => this.resetForm(), 3000);
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
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
