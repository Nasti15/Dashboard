import UIComponent from './UIComponent.js';

const API_KEY = '064a5db236fe4b1481a163934260910';

const WEATHER_CODES = {
  1000: { icon: '☀️', label: 'Ясно' },
  1003: { icon: '🌤', label: 'Переменная облачность' },
  1006: { icon: '☁️', label: 'Облачно' },
  1009: { icon: '☁️', label: 'Пасмурно' },
  1030: { icon: '🌫', label: 'Туман' },
  1063: { icon: '🌦', label: 'Возможен дождь' },
  1066: { icon: '🌨', label: 'Возможен снег' },
  1069: { icon: '🌨', label: 'Возможен снег с дождём' },
  1072: { icon: '🌨', label: 'Возможна изморозь' },
  1087: { icon: '⛈', label: 'Возможна гроза' },
  1114: { icon: '🌨', label: 'Метель' },
  1117: { icon: '❄️', label: 'Сильная метель' },
  1135: { icon: '🌫', label: 'Туман' },
  1147: { icon: '🌫', label: 'Ледяной туман' },
  1150: { icon: '🌦', label: 'Слабая морось' },
  1153: { icon: '🌦', label: 'Морось' },
  1168: { icon: '🌧', label: 'Ледяная морось' },
  1171: { icon: '🌧', label: 'Сильная ледяная морось' },
  1180: { icon: '🌧', label: 'Небольшой дождь' },
  1183: { icon: '🌧', label: 'Слабый дождь' },
  1186: { icon: '🌧', label: 'Умеренный дождь' },
  1189: { icon: '🌧', label: 'Дождь' },
  1192: { icon: '🌧', label: 'Сильный дождь' },
  1195: { icon: '🌧', label: 'Ливень' },
  1198: { icon: '🌧', label: 'Ледяной дождь' },
  1201: { icon: '🌧', label: 'Сильный ледяной дождь' },
  1204: { icon: '🌨', label: 'Мокрый снег' },
  1207: { icon: '🌨', label: 'Сильный мокрый снег' },
  1210: { icon: '🌨', label: 'Небольшой снег' },
  1213: { icon: '🌨', label: 'Слабый снег' },
  1216: { icon: '❄️', label: 'Умеренный снег' },
  1219: { icon: '❄️', label: 'Снег' },
  1222: { icon: '❄️', label: 'Сильный снег' },
  1225: { icon: '❄️', label: 'Снегопад' },
  1237: { icon: '🌧', label: 'Ледяная крупа' },
  1240: { icon: '🌦', label: 'Небольшой ливень' },
  1243: { icon: '🌧', label: 'Ливень' },
  1246: { icon: '🌧', label: 'Сильный ливень' },
  1249: { icon: '🌨', label: 'Ливень с мокрым снегом' },
  1252: { icon: '🌨', label: 'Сильный ливень с мокрым снегом' },
  1255: { icon: '🌨', label: 'Небольшой снегопад' },
  1258: { icon: '❄️', label: 'Снегопад' },
  1261: { icon: '🌧', label: 'Небольшой ледяной дождь' },
  1264: { icon: '🌧', label: 'Ледяной дождь' },
  1273: { icon: '⛈', label: 'Дождь с грозой' },
  1276: { icon: '⛈', label: 'Сильная гроза' },
  1279: { icon: '⛈', label: 'Снег с грозой' },
  1282: { icon: '❄️', label: 'Сильный снег с грозой' },
};

function describeWeather(code) {
  return WEATHER_CODES[code] ?? { icon: '🌡', label: '—' };
}

export default class WeatherWidget extends UIComponent {
  constructor(config = {}) {
    super({ title: config.title ?? 'Погода', id: config.id });
    this.kind = 'weather';
    this.city = config.city ?? {
      name: 'Санкт-Петербург',
      query: '59.9386,30.3141',
    };
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

    const targetUrl =
      `https://api.weatherapi.com/v1/current.json?key=${API_KEY}` +
      `&q=${encodeURIComponent(this.city.query)}&lang=ru`;

    // allorigins.win — бесплатный CORS-прокси, работает из РФ
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

    try {
      const res = await fetch(proxyUrl, { signal: this._aborter.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const current = data.current;
      if (!current) {
        this._renderState('empty', 'Нет данных');
        return;
      }

      const code = Number(current.condition.code);
      const w = describeWeather(code);
      const temp = current.temp_c;
      const humidity = current.humidity;
      const wind = current.wind_kph;

      const wrap = document.createElement('div');

      const head = document.createElement('div');
      head.className = 'weather-head';

      const bigIcon = document.createElement('span');
      bigIcon.className = 'weather-head__icon';
      bigIcon.setAttribute('aria-hidden', 'true');
      bigIcon.textContent = w.icon;

      const label = document.createElement('div');
      label.className = 'weather-head__label';

      const tempEl = document.createElement('div');
      tempEl.className = 'weather-head__temp';
      tempEl.textContent = `${temp} °C`;

      const desc = document.createElement('div');
      desc.className = 'weather-head__desc';
      desc.textContent = w.label;

      label.append(tempEl, desc);
      head.append(bigIcon, label);

      const rows = [
        ['Город', this.city.name],
        ['Влажность', `${humidity} %`],
        ['Ветер', `${wind} км/ч`],
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
        this.root.dataset.weather = this._weatherKind(code);
      }

      if (this._infoEl) this._infoEl.replaceChildren(wrap);
    } catch (err) {
      if (err.name === 'AbortError') return;
      this._renderState('error', 'Не удалось загрузить погоду');
    }
  }

  _weatherKind(code) {
    if (code === 1000 || code === 1003) return 'sunny';
    if (code >= 1087 && code <= 1282) return 'storm';
    if ([1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1249, 1252, 1255, 1258, 1261, 1264].includes(code)) return 'snow';
    if ([1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1237, 1240, 1243, 1246, 1273, 1276, 1279].includes(code)) return 'rain';
    return 'cloudy';
  }

  destroy() {
    if (this._aborter) this._aborter.abort();
    super.destroy();
  }
}