import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { apiError } from '../../services/api';
import { User } from '../../models/bank.models';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent {
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  user = signal<User | null>(null);
  avatar = signal('');
  saving = signal(false);
  readingPhoto = signal(false);
  error = signal('');
  message = signal('');
  sidebarOpen = window.innerWidth > 900;
  showPassword = false;
  private photoVersion = 0;
  form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80), Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.maxLength(30), Validators.pattern(/^[+\d\s().-]*$/)]],
    address: ['', Validators.maxLength(300)],
    currentPassword: [''],
  });
  constructor() {
    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.user.set(user);
      if (user) this.restore();
    });
  }
  get emailChanged() {
    return this.form.controls.email.value.trim().toLowerCase() !== this.user()?.email;
  }
  restore() {
    const user = this.user();
    if (!user) return;
    this.photoVersion++;
    this.readingPhoto.set(false);
    this.form.reset({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      currentPassword: '',
    });
    this.avatar.set(user.avatar || '');
    this.error.set('');
    this.message.set('');
    this.showPassword = false;
  }
  async uploadPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.error.set('');
    this.message.set('');
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 1048576) {
      this.error.set('Choose a PNG or JPEG photo, 1 MB or smaller.');
      return;
    }
    const version = ++this.photoVersion;
    this.readingPhoto.set(true);
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = result;
      });
      if (version === this.photoVersion) {
        this.avatar.set(result);
        this.form.markAsDirty();
      }
    } catch {
      if (version === this.photoVersion)
        this.error.set('This photo could not be opened. Choose another image.');
    } finally {
      if (version === this.photoVersion) this.readingPhoto.set(false);
    }
  }
  removePhoto() {
    this.photoVersion++;
    this.readingPhoto.set(false);
    this.avatar.set('');
    this.form.markAsDirty();
    this.message.set('');
  }
  save() {
    if (this.saving() || this.readingPhoto()) return;
    this.error.set('');
    this.message.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Check your name, email, phone and address.');
      return;
    }
    if (this.emailChanged && !this.form.controls.currentPassword.value) {
      this.error.set('Enter your current password to change your email.');
      return;
    }
    this.saving.set(true);
    this.auth
      .updateProfile({ ...this.form.getRawValue(), avatar: this.avatar() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.message.set('Your profile has been saved.');
        },
        error: (error) => {
          this.saving.set(false);
          this.error.set(apiError(error));
        },
      });
  }
}
