const STORAGE_KEY = 'dashboard-widgets';

export default class Dashboard {
  constructor(container, registry = {}) {
    this.container = container;
    this.registry = registry;
    this.widgets = new Map();
    this._renderEmpty();
  }

  /** Восстанавливает виджеты из localStorage. */
  restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      for (const type of list) {
        if (this.registry[type]) this.addWidget(type, { silent: true });
      }
    } catch {
      /* ignore */
    }
  }

  _save() {
    try {
      const order = [];
      for (const el of this.container.querySelectorAll('.widget')) {
        if (el.dataset.kind) order.push(el.dataset.kind);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      /* ignore */
    }
  }

  addWidget(widgetType, { silent = false } = {}) {
    const Ctor = this.registry[widgetType];
    if (!Ctor) {
      console.warn(`Неизвестный тип виджета: ${widgetType}`);
      return null;
    }

    const widget = new Ctor();
    const el = widget.render();

    const observer = new MutationObserver(() => {
      if (!document.body.contains(el)) {
        observer.disconnect();
        this.widgets.delete(widget.id);
        this._renderEmpty();
        if (!silent) this._save();
      }
    });
    observer.observe(this.container, { childList: true });

    this.container.appendChild(el);
    this.widgets.set(widget.id, widget);
    this._renderEmpty();

    if (!silent) this._save();

    return widget;
  }

  removeWidget(widgetId) {
    const w = this.widgets.get(widgetId);
    if (!w) return false;
    w.destroy();
    this.widgets.delete(widgetId);
    this._renderEmpty();
    this._save();
    return true;
  }

  /** Следит за изменениями порядка (после drag&drop) и сохраняет. */
  watchOrder() {
    const mo = new MutationObserver(() => this._save());
    mo.observe(this.container, { childList: true });
  }

  _renderEmpty() {
    const existing = this.container.querySelector('.empty-hint');
    const empty = this.widgets.size === 0;

    if (empty && !existing) {
      const p = document.createElement('p');
      p.className = 'empty-hint';
      p.textContent = 'Нет активных виджетов. Добавьте виджет из панели сверху.';
      this.container.appendChild(p);
    } else if (!empty && existing) {
      existing.remove();
    }
  }
}