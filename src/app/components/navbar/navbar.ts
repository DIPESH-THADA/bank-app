import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
