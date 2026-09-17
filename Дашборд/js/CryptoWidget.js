import UIComponent from './UIComponent.js';

export default class CryptoWidget extends UIComponent {
  constructor(config = {}) {
    super({ title: config.title ?? 'Курс крипты', id: config.id });
    this.kind = 'crypto';
    this.coins = config.coins ?? ['bitcoin', 'ethereum', 'solana'];
    this._aborter = null;
  }

  renderBody() {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '10px';

    const info = document.createElement('div');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quote-refresh';
    btn.textContent = 'Обновить';
    this._on(btn, 'click', () => this.load());

    const spark = document.createElement('div');
    spark.className = 'spark';
    this._sparkEl = spark;

    wrap.append(info, spark, btn);
    this._infoEl = info;

    this.load();
    this.loadSpark();
    return wrap;
  }

  _renderState(state, message) {
    if (!this._infoEl) return;
    this._infoEl.replaceChildren();
    if (state === 'loading') {
      const s = document.createElement('div');
      s.className = 'spinner';
      this._infoEl.appendChild(s);
      return;
    }
    const p = document.createElement('p');
    p.className = 'state' + (state === 'error' ? ' state--error' : '');
    p.textContent = message;
    this._infoEl.appendChild(p);
  }

  async load() {
    if (this._aborter) this._aborter.abort();
    this._aborter = this._newAborter();

    this._renderState('loading');

    const url =
      `https://api.coingecko.com/api/v3/simple/price?ids=${this.coins.join(',')}` +
      `&vs_currencies=usd&include_24hr_change=true`;

    try {
      const res = await fetch(url, { signal: this._aborter.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!data || Object.keys(data).length === 0) {
        this._renderState('empty', 'Нет данных');
        return;
      }

      const wrap = document.createElement('div');
      for (const id of this.coins) {
        const info = data[id];
        if (!info) continue;

        const change = info.usd_24h_change;
        const sign = change >= 0 ? '+' : '';
        const row = document.createElement('div');
        row.className = 'kv';

        const name = document.createElement('span');
        name.textContent = id[0].toUpperCase() + id.slice(1);

        const price = document.createElement('span');
        price.textContent = `$${info.usd.toLocaleString('en-US', { maximumFractionDigits: 2 })} (${sign}${change?.toFixed(2) ?? '0.00'}%)`;
        price.style.color = change >= 0 ? 'var(--ok)' : 'var(--danger)';

        row.append(name, price);
        wrap.appendChild(row);
      }

      if (this._infoEl) this._infoEl.replaceChildren(wrap);
    } catch (err) {
      if (err.name === 'AbortError') return;
      this._renderState('error', 'Не удалось загрузить курс');
    }
  }

  async loadSpark() {
    const coin = this.coins[0];
    const url =
      `https://api.coingecko.com/api/v3/coins/${coin}/market_chart` +
      `?vs_currency=usd&days=7`;

    try {
      const res = await fetch(url, { signal: this._newAborter().signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const prices = (data.prices ?? []).map((p) => p[1]);
      if (prices.length < 2) return;
      this._renderSpark(prices, coin);
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  _renderSpark(prices, coin) {
    if (!this._sparkEl) return;

    const W = 300;
    const H = 44;
    const pad = 3;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const stepX = (W - pad * 2) / (prices.length - 1);
    const points = prices.map((p, i) => {
      const x = pad + i * stepX;
      const y = H - pad - ((p - min) / range) * (H - pad * 2);
      return [x, y];
    });

    const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${points[points.length - 1][0].toFixed(1)},${H} L${points[0][0].toFixed(1)},${H} Z`;

    const first = prices[0];
    const last = prices[prices.length - 1];
    const delta = ((last - first) / first) * 100;
    const up = delta >= 0;
    const deltaText = `${up ? '+' : ''}${delta.toFixed(2)}%`;
    const label = coin[0].toUpperCase() + coin.slice(1);

    const [lastX, lastY] = points[points.length - 1];

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('spark__svg');

    const defs = document.createElementNS(svgNS, 'defs');
    const grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', `sparkGrad-${this.id}`);
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0');
    grad.setAttribute('y2', '1');

    const stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', up ? '#34d399' : '#ff7a86');
    stop1.setAttribute('stop-opacity', '0.35');

    const stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', up ? '#34d399' : '#ff7a86');
    stop2.setAttribute('stop-opacity', '0');

    grad.append(stop1, stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    const areaPath = document.createElementNS(svgNS, 'path');
    areaPath.setAttribute('d', area);
    areaPath.setAttribute('fill', `url(#sparkGrad-${this.id})`);
    svg.appendChild(areaPath);

    const linePath = document.createElementNS(svgNS, 'path');
    linePath.setAttribute('d', line);
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', up ? '#10b981' : '#e05361');
    linePath.setAttribute('stroke-width', '2');
    linePath.setAttribute('stroke-linecap', 'round');
    linePath.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(linePath);

    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', lastX.toFixed(1));
    dot.setAttribute('cy', lastY.toFixed(1));
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', up ? '#10b981' : '#e05361');
    dot.setAttribute('stroke', 'var(--panel)');
    dot.setAttribute('stroke-width', '2');
    svg.appendChild(dot);

    const head = document.createElement('div');
    head.className = 'spark__head';

    const lbl = document.createElement('span');
    lbl.className = 'spark__label';
    lbl.textContent = `${label} · 7 дней`;

    const dlt = document.createElement('span');
    dlt.className = 'spark__delta ' + (up ? 'up' : 'down');
    dlt.textContent = deltaText;

    head.append(lbl, dlt);

    this._sparkEl.replaceChildren(head, svg);
  }

  destroy() {
    if (this._aborter) this._aborter.abort();
    super.destroy();
  }
}