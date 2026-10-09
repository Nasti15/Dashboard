export default class ThemeManager {
  static STORAGE_KEY = 'dashboard-theme';
  static LIGHT = 'light';
  static DARK = 'dark';

  constructor({ button } = {}) {
    this.button = button ?? null;
    this.iconEl = this.button?.querySelector('.theme-toggle__icon') ?? null;

    const saved = localStorage.getItem(ThemeManager.STORAGE_KEY);
    const preferred = saved
      ?? (window.matchMedia('(prefers-color-scheme: dark)').matches
          ? ThemeManager.DARK
          : ThemeManager.LIGHT);

    this.theme = preferred;
    this._apply();
    this._renderButton();

    this._onClick = () => this.toggle();
    this.button?.addEventListener('click', this._onClick);
  }

  toggle() {
    this.theme = this.theme === ThemeManager.DARK
      ? ThemeManager.LIGHT
      : ThemeManager.DARK;
    localStorage.setItem(ThemeManager.STORAGE_KEY, this.theme);
    this._apply();
    this._renderButton();
  }

  _apply() {
    document.documentElement.dataset.theme = this.theme;
  }

  _renderButton() {
    if (!this.button) return;
    const isDark = this.theme === ThemeManager.DARK;
    if (this.iconEl) this.iconEl.textContent = isDark ? '☀️' : '🌙';
    this.button.setAttribute(
      'aria-label',
      isDark ? 'Включить светлую тему' : 'Включить тёмную тему'
    );
    this.button.setAttribute('aria-pressed', String(isDark));
  }

  destroy() {
    this.button?.removeEventListener('click', this._onClick);
  }
}