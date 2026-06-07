import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { TransactionsComponent } from './components/transactions/transactions';
import { FundTransferComponent } from './components/fund-transfer/fund-transfer';
import { AccountDetailsComponent } from './components/account-details/account-details';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent
  },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'transfer', component: FundTransferComponent },
  { path: 'accounts', component: AccountDetailsComponent },
  { path: '**', redirectTo: '/login' }
];
