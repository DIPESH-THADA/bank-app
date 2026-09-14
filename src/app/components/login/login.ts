import { ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { apiError } from '../../services/api';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  themeService = inject(ThemeService);
  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  showPassword = false;
  loading = false;
  error = '';
  success = false;
  currentYear = new Date().getFullYear();
  tryDemo() {
    this.form.setValue({ email: 'demo@nexusbank.test', password: 'NexusDemo!2026' });
    this.login();
  }
  login() {
    if (this.loading) return;
    if (this.form.invalid) {
      this.error = 'Enter a valid email and password.';
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.getRawValue();
    this.authService
      .login(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
          this.loading = false;
          const target = this.route.snapshot.queryParamMap.get('returnUrl');
          this.router.navigateByUrl(
            target?.startsWith('/') && !target.startsWith('//') ? target : '/dashboard',
          );
        },
        error: (error) => {
          this.cdr.markForCheck();
          this.loading = false;
          this.error = apiError(error);
        },
      });
  }
}
