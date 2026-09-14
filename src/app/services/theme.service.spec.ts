import { ThemeService } from './theme.service';
describe('theme persistence', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
  it('restores and persists the selected theme', () => {
    localStorage.setItem('nexus-theme', 'dark');
    const service = new ThemeService();
    expect(service.isDarkMode()).toBe(true);
    service.toggleTheme();
    expect(localStorage.getItem('nexus-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
