import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';
  currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  login() {
    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe(
      (success) => {
        this.loading = false;
        if (success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Invalid email or password';
        }
      }
    );
  }
}
