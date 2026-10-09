import UIComponent from './UIComponent.js';
import Confetti from './Confetti.js';

const STORAGE_KEY = 'dashboard-todo';

export default class ToDoWidget extends UIComponent {
  constructor(config = {}) {
    super({ title: config.title ?? 'Список дел', id: config.id });
    this.kind = 'todo';
    this.tasks = this._load();
    this._seq = this.tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1;
    this._listEl = null;
    this._progressFill = null;
    this._progressText = null;
    this._wasComplete = this.tasks.length > 0 && this.tasks.every((t) => t.done);
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
    } catch {
      /* localStorage может быть недоступен — молча игнорируем */
    }
  }

  renderBody() {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '10px';

    const form = document.createElement('form');
    form.className = 'todo-form';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'task';
    input.id = `todo-input-${this.id}`;
    input.placeholder = 'Новая задача…';
    input.setAttribute('aria-label', 'Текст новой задачи');

    const addBtn = document.createElement('button');
    addBtn.type = 'submit';
    addBtn.textContent = 'Добавить';

    form.append(input, addBtn);

    const progress = document.createElement('div');
    progress.className = 'todo-progress';

    const progressBar = document.createElement('div');
    progressBar.className = 'todo-progress__bar';

    const progressFill = document.createElement('div');
    progressFill.className = 'todo-progress__fill';
    progressBar.appendChild(progressFill);

    const progressText = document.createElement('span');
    progressText.className = 'todo-progress__text';
    progressText.textContent = '0 / 0';

    progress.append(progressBar, progressText);

    this._progressFill = progressFill;
    this._progressText = progressText;

    const list = document.createElement('ul');
    list.className = 'todo-list';
    this._listEl = list;

    const onAdd = (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      this.addTask(text);
      input.value = '';
      input.focus();
    };
    this._on(form, 'submit', onAdd);

    wrap.append(form, progress, list);
    this._renderList();
    return wrap;
  }

  addTask(text) {
    this.tasks.push({ id: this._seq++, text, done: false });
    this._save();
    this._renderList();
  }

  removeTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this._save();
    this._renderList();
  }

  toggleTask(id) {
    const t = this.tasks.find((x) => x.id === id);
    if (t) t.done = !t.done;
    this._save();
    this._renderList();
  }

  _renderList() {
    if (!this._listEl) return;
    this._listEl.replaceChildren();

    if (this.tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'state';
      empty.textContent = 'Задач пока нет';
      this._listEl.appendChild(empty);
      this._renderProgress();
      return;
    }

    for (const task of this.tasks) {
      const li = document.createElement('li');
      li.className = 'todo-item' + (task.done ? ' done' : '');

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = task.done;
      cb.setAttribute('aria-label', `Отметить задачу: ${task.text}`);
      cb.addEventListener('change', () => this.toggleTask(task.id));

      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = task.text;

      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'todo-remove';
      rm.textContent = '×';
      rm.setAttribute('aria-label', `Удалить задачу: ${task.text}`);
      rm.addEventListener('click', () => this.removeTask(task.id));

      li.append(cb, span, rm);
      this._listEl.appendChild(li);
    }

    this._renderProgress();
  }

  _renderProgress() {
    if (!this._progressFill || !this._progressText) return;

    const total = this.tasks.length;
    const done = this.tasks.filter((t) => t.done).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    this._progressFill.style.width = `${percent}%`;
    this._progressText.textContent = `${done} / ${total}`;

    const isComplete = total > 0 && done === total;

    if (isComplete) {
      this._progressFill.style.background =
        'linear-gradient(90deg, #34d399, #10b981)';
    } else {
      this._progressFill.style.background =
        'linear-gradient(90deg, var(--sky-400), var(--sky-500))';
    }

    if (isComplete && !this._wasComplete) {
      this._fireConfetti();
    }
    this._wasComplete = isComplete;
  }

  _fireConfetti() {
    requestAnimationFrame(() => {
      const host = this.root;
      if (!host) return;
      new Confetti(host, { count: 48 }).fire();
    });
  }
}