import Dashboard from './js/Dashboard.js';
import ToDoWidget from './js/ToDoWidget.js';
import QuoteWidget from './js/QuoteWidget.js';
import WeatherWidget from './js/WeatherWidget.js';
import CryptoWidget from './js/CryptoWidget.js';
import ThemeManager from './js/ThemeManager.js';
import ConfettiGlobal from './js/ConfettiGlobal.js';

const registry = {
  todo: ToDoWidget,
  quote: QuoteWidget,
  weather: WeatherWidget,
  crypto: CryptoWidget,
};

const container = document.getElementById('dashboard');
const dashboard = new Dashboard(container, registry);

document.querySelectorAll('[data-add]').forEach((btn) => {
  btn.addEventListener('click', () => {
    dashboard.addWidget(btn.dataset.add);
  });
});

// Стартовый набор
dashboard.addWidget('todo');
dashboard.addWidget('weather');
dashboard.addWidget('crypto');
dashboard.addWidget('quote');

// Тень у шапки при скролле
const topbar = document.querySelector('.topbar');
window.addEventListener('scroll', () => {
  topbar.classList.toggle('is-scrolled', window.scrollY > 4);
}, { passive: true });

// Тема
new ThemeManager({ button: document.getElementById('theme-toggle') });

// ===== Живые часы =====
const timeEl = document.getElementById('clock-time');
const dateEl = document.getElementById('clock-date');
function tick() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  timeEl.textContent = `${hh}:${mm}:${ss}`;
  dateEl.textContent = now.toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}
tick();
setInterval(tick, 1000);

// ===== Пасхалка на логотип =====
const brand = document.getElementById('brand');
const fx = new ConfettiGlobal();
let brandClicks = 0;
brand.addEventListener('click', () => {
  const r = brand.getBoundingClientRect();
  fx.fire(r.left + r.width / 2, r.top + r.height / 2);
  brandClicks++;
  if (brandClicks === 5) {
    // Бонусный мега-салют
    setTimeout(() => {
      fx.fire(window.innerWidth * 0.25, window.innerHeight * 0.4);
      fx.fire(window.innerWidth * 0.75, window.innerHeight * 0.4);
      fx.fire(window.innerWidth * 0.5, window.innerHeight * 0.6);
    }, 200);
    brandClicks = 0;
  }
});

// ===== Параллакс фона + фонарик =====
const glow = document.createElement('div');
glow.className = 'cursor-glow';
document.body.appendChild(glow);

let targetX = 0, targetY = 0;
let curX = 0, curY = 0;

window.addEventListener('mousemove', (e) => {
  targetX = (e.clientX / window.innerWidth - 0.5) * 24;
  targetY = (e.clientY / window.innerHeight - 0.5) * 24;

  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
  glow.classList.add('is-active');
}, { passive: true });

window.addEventListener('mouseleave', () => {
  glow.classList.remove('is-active');
});

function loop() {
  curX += (targetX - curX) * 0.06;
  curY += (targetY - curY) * 0.06;
  document.documentElement.style.setProperty('--par-x', `${curX.toFixed(2)}px`);
  document.documentElement.style.setProperty('--par-y', `${curY.toFixed(2)}px`);
  requestAnimationFrame(loop);
}
loop();

// Часы в футере — тикают каждую секунду
function tickFooter() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  footerTimeEl.textContent = `${hh}:${mm}:${ss}`;
}
tickFooter();
setInterval(tickFooter, 1000);

// Погода в СПб — обновляем каждые 10 минут
async function loadFooterWeather() {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=59.9386&longitude=30.3141' +
    '&current=temperature_2m,weather_code&timezone=auto';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const temp = Math.round(data.current?.temperature_2m ?? 0);
    footerWeatherEl.textContent = `СПб · ${temp > 0 ? '+' : ''}${temp}°`;
  } catch {
    footerWeatherEl.textContent = 'СПб · —';
  }
}
loadFooterWeather();
setInterval(loadFooterWeather, 10 * 60 * 1000);

// BTC — обновляем каждые 2 минуты
async function loadFooterBtc() {
  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin' +
    '&vs_currencies=usd&include_24hr_change=true';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const price = data?.bitcoin?.usd;
    const change = data?.bitcoin?.usd_24h_change ?? 0;
    if (price == null) {
      footerBtcEl.textContent = 'BTC · —';
      return;
    }
    const sign = change >= 0 ? '+' : '';
    footerBtcEl.textContent = `BTC · $${price.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${sign}${change.toFixed(1)}%)`;
    footerBtcEl.classList.toggle('up', change >= 0);
    footerBtcEl.classList.toggle('down', change < 0);
  } catch {
    footerBtcEl.textContent = 'BTC · —';
  }
}
loadFooterBtc();
