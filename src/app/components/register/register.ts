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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  themeService = inject(ThemeService);
  form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(128),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/),
      ],
    ],
    confirmPassword: ['', [Validators.required]],
  });
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  error = '';
  success = false;
  currentYear = new Date().getFullYear();
  verificationToken = '';
  register() {
    if (this.loading) return;
    if (this.form.invalid) {
      this.error =
        'Complete all fields. Password must be 12 to 128 characters with uppercase, lowercase, number and symbol.';
      return;
    }
    const { name, email, password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService
      .register(name, email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.cdr.markForCheck();
          this.loading = false;
          this.success = true;
          this.verificationToken = result.verificationToken;
          this.form.reset();
        },
        error: (error) => {
          this.cdr.markForCheck();
          this.loading = false;
          this.error = apiError(error);
        },
      });
  }
  verify() {
    if (this.loading) return;
    this.loading = true;
    this.authService
      .verify(this.verificationToken)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/login']),
        error: (error) => {
          this.cdr.markForCheck();
          this.loading = false;
          this.error = apiError(error);
        },
      });
  }
}
