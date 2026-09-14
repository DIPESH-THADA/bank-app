import { ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {
  DestroyRef,
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  HostListener,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/bank.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  @Input() showMenuToggle = false;
  @Output() menuToggle = new EventEmitter<void>();

  currentUser: User | null = null;
  showNotifications = false;
  showUserMenu = false;
  logoutError = '';

  notificationService = inject(NotificationService);

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router,
  ) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.cdr.markForCheck();
      this.currentUser = user;
    });
  }

  onMenuToggle() {
    this.menuToggle.emit();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  markAllRead() {
    this.notificationService.markAllRead();
  }

  closeDropdowns() {
    this.showNotifications = false;
    this.showUserMenu = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeDropdowns();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.cdr.markForCheck();
        this.logoutError = 'Logout failed. Please try again.';
      },
    });
  }
}
