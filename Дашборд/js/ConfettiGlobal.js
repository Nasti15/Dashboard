/**
 * Салют эмодзи на весь экран. Для пасхалки на клик по логотипу.
 */
export default class ConfettiGlobal {
  constructor(options = {}) {
    this.emojis = options.emojis ?? ['🌈', '✨', '⭐', '💙', '🎉', '☁️', '🫧', '💫'];
    this.count = options.count ?? 28;
  }

  fire(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    const layer = document.createElement('div');
    layer.className = 'fx-layer';
    document.body.appendChild(layer);

    for (let i = 0; i < this.count; i++) {
      const el = document.createElement('span');
      el.className = 'fx-piece';
      el.textContent = this.emojis[i % this.emojis.length];

      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 260;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 60;
      const rot = (Math.random() * 720 - 360) | 0;
      const dur = 1100 + Math.random() * 600;
      const delay = Math.random() * 150;
      const size = 20 + Math.random() * 18;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.fontSize = `${size}px`;
      el.style.setProperty('--dx', `${dx}px`);
      el.style.setProperty('--dy', `${dy}px`);
      el.style.setProperty('--rot', `${rot}deg`);
      el.style.animationDuration = `${dur}ms`;
      el.style.animationDelay = `${delay}ms`;

      layer.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }

    setTimeout(() => layer.remove(), 2200);
  }
}