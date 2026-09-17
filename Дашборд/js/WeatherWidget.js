import UIComponent from './UIComponent.js';

const WEATHER_CODES = {
  0:  { icon: '☀️', label: 'Ясно' },
  1:  { icon: '🌤', label: 'Преимущественно ясно' },
  2:  { icon: '⛅', label: 'Переменная облачность' },
  3:  { icon: '☁️', label: 'Пасмурно' },
  45: { icon: '🌫', label: 'Туман' },
  48: { icon: '🌫', label: 'Изморозь' },
  51: { icon: '🌦', label: 'Морось слабая' },
  53: { icon: '🌦', label: 'Морось' },
  55: { icon: '🌧', label: 'Морось сильная' },
  56: { icon: '🌧', label: 'Ледяная морось' },
  57: { icon: '🌧', label: 'Ледяная морось' },
  61: { icon: '🌧', label: 'Дождь слабый' },
  63: { icon: '🌧', label: 'Дождь' },
  65: { icon: '🌧', label: 'Дождь сильный' },
  66: { icon: '🌧', label: 'Ледяной дождь' },
  67: { icon: '🌧', label: 'Ледяной дождь' },
  71: { icon: '🌨', label: 'Снег слабый' },
  73: { icon: '🌨', label: 'Снег' },
  75: { icon: '❄️', label: 'Снег сильный' },
  77: { icon: '❄️', label: 'Снежные зёрна' },
  80: { icon: '🌦', label: 'Ливень слабый' },
  81: { icon: '🌧', label: 'Ливень' },
  82: { icon: '⛈', label: 'Ливень сильный' },
  85: { icon: '🌨', label: 'Снегопад' },
  86: { icon: '❄️', label: 'Снегопад сильный' },
  95: { icon: '⛈', label: 'Гроза' },
  96: { icon: '⛈', label: 'Гроза с градом' },
  99: { icon: '⛈', label: 'Гроза с градом' },
};

function describeWeather(code) {
  return WEATHER_CODES[code] ?? { icon: '🌡', label: '—' };
}

export default class WeatherWidget extends UIComponent {
  constructor(config = {}) {
    super({ title: config.title ?? 'Погода', id: config.id, icon: '☁' });
    this.kind = 'weather';
    this.city = config.city ?? { name: 'Санкт-Петербург', lat: 59.9386, lon: 30.3141 };
    this._aborter = null;
  }

  renderBody() {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '10px';

    const info = document.createElement('div');
    info.className = 'weather-info';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quote-refresh';
    btn.textContent = 'Обновить';
    this._on(btn, 'click', () => this.load());

    wrap.append(info, btn);
    this._infoEl = info;

    this.load();
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

    const { lat, lon } = this.city;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&timezone=auto`;

    try {
      const res = await fetch(url, { signal: this._aborter.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const c = data.current;
      if (!c) {
        this._renderState('empty', 'Нет данных');
        return;
      }

      const w = describeWeather(c.weather_code);

      const wrap = document.createElement('div');

      const head = document.createElement('div');
      head.className = 'weather-head';

      const bigIcon = document.createElement('span');
      bigIcon.className = 'weather-head__icon';
      bigIcon.setAttribute('aria-hidden', 'true');
      bigIcon.textContent = w.icon;

      const label = document.createElement('div');
      label.className = 'weather-head__label';

      const temp = document.createElement('div');
      temp.className = 'weather-head__temp';
      temp.textContent = `${c.temperature_2m} °C`;

      const desc = document.createElement('div');
      desc.className = 'weather-head__desc';
      desc.textContent = w.label;

      label.append(temp, desc);
      head.append(bigIcon, label);

      const rows = [
        ['Город', this.city.name],
        ['Влажность', `${c.relative_humidity_2m} %`],
        ['Ветер', `${c.wind_speed_10m} м/с`],
      ];

      wrap.appendChild(head);
      for (const [k, v] of rows) {
        const row = document.createElement('div');
        row.className = 'kv';
        const a = document.createElement('span');
        a.textContent = k;
        const b = document.createElement('span');
        b.textContent = v;
        row.append(a, b);
        wrap.appendChild(row);
      }

      if (this.root) {
        this.root.dataset.weather = this._weatherKind(c.weather_code);
      }

      if (this._infoEl) this._infoEl.replaceChildren(wrap);
    } catch (err) {
      if (err.name === 'AbortError') return;
      this._renderState('error', 'Не удалось загрузить погоду');
    }
  }

  _weatherKind(code) {
    if (code === 0 || code === 1) return 'sunny';
    if (code >= 95) return 'storm';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 80 && code <= 82) return 'rain';
    return 'cloudy';
  }

  destroy() {
    if (this._aborter) this._aborter.abort();
    super.destroy();
  }
}