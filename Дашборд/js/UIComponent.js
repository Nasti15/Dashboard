/**
 * Базовый абстрактный класс для всех виджетов.
 */
export default class UIComponent {
  constructor({ title, id } = {}) {
    if (new.target === UIComponent) {
      throw new Error('UIComponent is abstract and cannot be instantiated directly.');
    }
    this.id = id ?? `widget-${Math.random().toString(36).slice(2, 9)}`;
    this.title = title ?? 'Widget';
    this.kind = null;
    this.root = null;
    this._listeners = [];
    this._aborters = [];
    this._minimized = false;
    this._dragState = null;
  }

  render() {
    const root = document.createElement('section');
    root.className = 'widget';
    root.id = this.id;
    root.setAttribute('aria-label', this.title);
    if (this.kind) root.dataset.kind = this.kind;

    const header = document.createElement('header');
    header.className = 'widget__header';

    const h = document.createElement('h2');
    h.className = 'widget__title';
    h.textContent = this.title;

    const actions = document.createElement('div');
    actions.className = 'widget__actions';

    const btnMin = document.createElement('button');
    btnMin.className = 'widget__btn';
    btnMin.type = 'button';
    btnMin.title = 'Свернуть';
    btnMin.setAttribute('aria-label', 'Свернуть виджет');
    btnMin.textContent = '—';

    const btnClose = document.createElement('button');
    btnClose.className = 'widget__btn widget__btn--danger';
    btnClose.type = 'button';
    btnClose.title = 'Закрыть';
    btnClose.setAttribute('aria-label', 'Закрыть виджет');
    btnClose.textContent = '×';

    actions.append(btnMin, btnClose);
    header.append(h, actions);

    const body = document.createElement('div');
    body.className = 'widget__body';
    body.appendChild(this.renderBody());

    root.append(header, body);
    this.root = root;

    this._on(btnMin, 'click', (e) => { e.stopPropagation(); this.minimize(); });
    this._on(btnClose, 'click', (e) => { e.stopPropagation(); this.destroy(); });

    this._attachDrag(header);

    return root;
  }

  _attachDrag(handle) {
    let offsetX = 0;
    let offsetY = 0;

    const onDown = (e) => {
      if (e.target.closest('button')) return;
      if (e.button !== 0) return;

      e.preventDefault();
      const root = this.root;
      if (!root) return;

      const rect = root.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      root.classList.add('is-dragging');
      root.style.position = 'fixed';
      root.style.left = `${rect.left}px`;
      root.style.top = `${rect.top}px`;
      root.style.width = `${rect.width}px`;
      root.style.zIndex = 50;
      root.style.pointerEvents = 'none';

      this._dragState = { offsetX, offsetY };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    const onMove = (e) => {
      const root = this.root;
      if (!root || !this._dragState) return;
      root.style.left = `${e.clientX - this._dragState.offsetX}px`;
      root.style.top = `${e.clientY - this._dragState.offsetY}px`;
      this._highlightDropTarget(e.clientX, e.clientY);
    };

    const onUp = (e) => {
      const root = this.root;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (!root) return;

      const { target, position } = this._findDropTarget(e.clientX, e.clientY);

      root.style.position = '';
      root.style.left = '';
      root.style.top = '';
      root.style.width = '';
      root.style.zIndex = '';
      root.style.pointerEvents = '';
      root.classList.remove('is-dragging');

      this._clearDropTargets();

      if (target && target !== root) {
        if (position === 'before') {
          target.parentNode.insertBefore(root, target);
        } else {
          target.parentNode.insertBefore(root, target.nextSibling);
        }
      }

      this._dragState = null;
    };

    this._on(handle, 'mousedown', onDown);
  }

  _highlightDropTarget(x, y) {
    this._clearDropTargets();
    const { target } = this._findDropTarget(x, y);
    if (target && target !== this.root) {
      target.classList.add('is-drop-target');
    }
  }

  _clearDropTargets() {
    document.querySelectorAll('.widget.is-drop-target')
      .forEach((el) => el.classList.remove('is-drop-target'));
  }

  _findDropTarget(x, y) {
    const widgets = Array.from(document.querySelectorAll('.widget'))
      .filter((el) => el !== this.root);

    let best = null;
    let bestDist = Infinity;
    let position = 'after';

    for (const el of widgets) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        position = y < r.top + r.height / 2 ? 'before' : 'after';
        return { target: el, position };
      }
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestDist) {
        bestDist = d;
        best = el;
        position = y < cy ? 'before' : 'after';
      }
    }

    if (best && bestDist < 200) {
      return { target: best, position };
    }
    return { target: null, position: 'after' };
  }

  renderBody() {
    const p = document.createElement('p');
    p.className = 'state';
    p.textContent = 'Пустой виджет';
    return p;
  }

  minimize() {
    if (!this.root) return;
    this._minimized = !this._minimized;
    this.root.classList.toggle('is-minimized', this._minimized);
  }

  destroy() {
    this._aborters.forEach((c) => c.abort());
    this._aborters = [];
    this._listeners.forEach(({ el, type, handler }) =>
      el.removeEventListener(type, handler)
    );
    this._listeners = [];
    this.root?.remove();
    this.root = null;
  }

  _on(el, type, handler, options) {
    el.addEventListener(type, handler, options);
    this._listeners.push({ el, type, handler });
  }

  _newAborter() {
    const c = new AbortController();
    this._aborters.push(c);
    return c;
  }
}