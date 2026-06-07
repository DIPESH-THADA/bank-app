import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDarkMode = signal(false);
  isDarkMode = this._isDarkMode.asReadonly();

  constructor() {
    const saved = localStorage.getItem('nexus-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (!saved && prefersDark);
    this._isDarkMode.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  toggleTheme() {
    const next = !this._isDarkMode();
    this._isDarkMode.set(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('nexus-theme', next ? 'dark' : 'light');
  }
}
