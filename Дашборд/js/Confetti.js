/**
 * Простой салют из цветных частиц поверх карточки.
 * Использует только DOM + CSS-анимации, без библиотек.
 */
export default class Confetti {
  constructor(container, options = {}) {
    this.container = container;
    this.colors = options.colors ?? [
      '#3aa0f7', '#6cbcff', '#9ed3ff',
      '#a78bfa', '#7c5cf0',
      '#fbbf24', '#f59e0b',
      '#34d399', '#10b981',
      '#ff7a86',
    ];
    this.count = options.count ?? 42;
  }

  fire() {
    const root = this.container;
    if (!root) return;

    root.style.position = root.style.position || 'relative';
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    root.appendChild(layer);

    const rect = root.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    for (let i = 0; i < this.count; i++) {
      const p = document.createElement('span');
      p.className = 'confetti-piece';

      const color = this.colors[i % this.colors.length];
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 90;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 30;
      const size = 5 + Math.random() * 5;
      const rot = (Math.random() * 360) | 0;
      const dur = 700 + Math.random() * 500;
      const delay = Math.random() * 120;

      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.width = `${size}px`;
      p.style.height = `${size * (Math.random() < 0.5 ? 1 : 0.5)}px`;
      p.style.background = color;
      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--dy', `${dy}px`);
      p.style.setProperty('--rot', `${rot}deg`);
      p.style.animationDuration = `${dur}ms`;
      p.style.animationDelay = `${delay}ms`;

      layer.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }

    setTimeout(() => layer.remove(), 1500);
  }
}