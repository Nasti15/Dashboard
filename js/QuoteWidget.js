import UIComponent from './UIComponent.js';

const QUOTES = [
  { text: 'Простота — высшая форма изысканности.', author: 'Леонардо да Винчи' },
  { text: 'Сделай сегодня то, что другие не хотят, — завтра получишь то, что другие не могут.', author: 'Неизвестный' },
  { text: 'Лучший способ предсказать будущее — создать его.', author: 'Питер Друкер' },
  { text: 'Всё гениальное — просто.', author: 'Иосиф Бродский' },
  { text: 'Если ты не можешь объяснить это просто, значит, ты не до конца понял.', author: 'Альберт Эйнштейн' },
];

export default class QuoteWidget extends UIComponent {
  constructor(config = {}) {
    super({ title: config.title ?? 'Цитата дня', id: config.id, icon: '❝' });
    this.kind = 'quote';
    this.quotes = QUOTES;
    this.current = null;
  }

  renderBody() {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '10px';

    const text = document.createElement('p');
    text.className = 'quote-text';

    const author = document.createElement('p');
    author.className = 'quote-author';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quote-refresh';
    btn.textContent = 'Обновить';

    this._on(btn, 'click', () => this.refresh());

    wrap.append(text, author, btn);
    this._textEl = text;
    this._authorEl = author;

    this.refresh();
    return wrap;
  }

  refresh() {
    let next;
    do {
      next = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    } while (this.quotes.length > 1 && this.current && next === this.current);

    this.current = next;
    if (this._textEl) this._textEl.textContent = `«${next.text}»`;
    if (this._authorEl) this._authorEl.textContent = `— ${next.author}`;
  }
}