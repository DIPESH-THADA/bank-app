import { Component, Input, Output, EventEmitter, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/bank.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  @Input() showMenuToggle = false;
  @Output() menuToggle = new EventEmitter<void>();

  currentUser: User | null = null;
  showNotifications = false;
  showUserMenu = false;

  notificationService = inject(NotificationService);

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
