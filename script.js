/* =========================================================
   КОЛЕСО ФОРТУНЫ PRO
   ========================================================= */

/* ===================== ДАННЫЕ ===================== */
const DEFAULT_OPTIONS = [
  { text: 'Да',        color: '#22c55e' },
  { text: 'Нет',       color: '#ef4444' },
  { text: 'Возможно',  color: '#f59e0b' },
  { text: 'Точно да',  color: '#06b6d4' },
  { text: 'Точно нет', color: '#a855f7' },
  { text: 'Повезёт',   color: '#ec4899' },
];

const PRESETS = {
  'yes-no': {
    name: 'Да / Нет',
    emoji: '⚖️',
    options: [
      { text: 'Да',  color: '#22c55e' },
      { text: 'Нет', color: '#ef4444' },
    ],
  },
  'classic': {
    name: 'Классика',
    emoji: '🎯',
    options: DEFAULT_OPTIONS,
  },
  'food': {
    name: 'Еда',
    emoji: '🍕',
    options: [
      { text: 'Пицца',    color: '#ef4444' },
      { text: 'Суши',     color: '#f59e0b' },
      { text: 'Бургер',   color: '#a855f7' },
      { text: 'Паста',    color: '#22c55e' },
      { text: 'Салат',    color: '#84cc16' },
      { text: 'Шашлык',   color: '#dc2626' },
      { text: 'Борщ',     color: '#c2410c' },
      { text: 'Пельмени', color: '#06b6d4' },
    ],
  },
  'numbers': {
    name: '1 – 8',
    emoji: '🔢',
    options: Array.from({ length: 8 }, (_, i) => ({
      text: String(i + 1),
      color: `hsl(${i * 45}, 70%, 50%)`,
    })),
  },
  'truth': {
    name: 'Правда/Действие',
    emoji: '🎲',
    options: [
      { text: 'Правда',     color: '#06b6d4' },
      { text: 'Действие',   color: '#ec4899' },
      { text: 'Пропуск',    color: '#f59e0b' },
      { text: 'Двойной',    color: '#a855f7' },
    ],
  },
  'prize': {
    name: 'Призы',
    emoji: '🎁',
    options: [
      { text: '100₽',       color: '#22c55e' },
      { text: '500₽',       color: '#f59e0b' },
      { text: '1000₽',      color: '#06b6d4' },
      { text: 'Пусто',      color: '#6b7280' },
      { text: 'Пусто',      color: '#6b7280' },
      { text: 'Джекпот!',   color: '#ffd166' },
      { text: 'Скидка',     color: '#a855f7' },
      { text: 'Бонус',      color: '#ec4899' },
    ],
  },
};

let options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));

/* ===================== CANVAS ===================== */
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const SIZE = canvas.width;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 20;

let currentAngle = 0;
let spinning = false;

/* Отрисовка */
function drawWheel(angle) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  const n = options.length;
  if (n === 0) return;
  const arc = (Math.PI * 2) / n;

  // Внешнее кольцо
  const ringGrad = ctx.createRadialGradient(CENTER, CENTER, RADIUS - 8, CENTER, CENTER, RADIUS + 14);
  ringGrad.addColorStop(0, 'rgba(255,255,255,0)');
  ringGrad.addColorStop(0.7, 'rgba(255, 209, 102, .35)');
  ringGrad.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS + 10, 0, Math.PI * 2);
  ctx.fillStyle = ringGrad;
  ctx.fill();

  // Сектора
  for (let i = 0; i < n; i++) {
    const start = angle + i * arc;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, start, end);
    ctx.closePath();

    const grad = ctx.createRadialGradient(CENTER, CENTER, RADIUS * 0.1, CENTER, CENTER, RADIUS);
    grad.addColorStop(0, shade(options[i].color, 50));
    grad.addColorStop(0.6, options[i].color);
    grad.addColorStop(1, shade(options[i].color, -25));
    ctx.fillStyle = grad;
    ctx.fill();

    // Разделитель
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Блик на секторе
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, start, end);
    ctx.closePath();
    ctx.clip();
    const shine = ctx.createLinearGradient(
      CENTER + Math.cos(start) * RADIUS,
      CENTER + Math.sin(start) * RADIUS,
      CENTER + Math.cos(end) * RADIUS,
      CENTER + Math.sin(end) * RADIUS
    );
    shine.addColorStop(0, 'rgba(255,255,255,.18)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0)');
    shine.addColorStop(1, 'rgba(0,0,0,.12)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.restore();

    // Текст
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    const fontSize = Math.max(18, Math.min(36, 560 / n));
    ctx.font = `800 ${fontSize}px 'Segoe UI', sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    const label = options[i].text.length > 18
      ? options[i].text.slice(0, 17) + '…'
      : options[i].text;
    ctx.fillText(label, RADIUS - 30, 0);
    ctx.restore();
  }

  // Внутренний обод
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Заклёпки по краю
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      CENTER + Math.cos(a) * (RADIUS - 10),
      CENTER + Math.sin(a) * (RADIUS - 10),
      4, 0, Math.PI * 2
    );
    const g = ctx.createRadialGradient(
      CENTER + Math.cos(a) * (RADIUS - 10) - 1,
      CENTER + Math.sin(a) * (RADIUS - 10) - 1,
      0,
      CENTER + Math.cos(a) * (RADIUS - 10),
      CENTER + Math.sin(a) * (RADIUS - 10),
      5
    );
    g.addColorStop(0, '#fff');
    g.addColorStop(1, 'rgba(255,255,255,.25)');
    ctx.fillStyle = g;
    ctx.fill();
  }

  // Центральный круг
  const centerGrad = ctx.createRadialGradient(CENTER - 20, CENTER - 20, 0, CENTER, CENTER, 90);
  centerGrad.addColorStop(0, 'rgba(255,255,255,.15)');
  centerGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 90, 0, Math.PI * 2);
  ctx.fillStyle = centerGrad;
  ctx.fill();
}

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0x00FF) + amt;
  let b = (num & 0x0000FF) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

/* =========================================================
   ЗВУК (Web Audio API)
   ========================================================= */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.tickEnabled = true;
  }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) this.ctx = new AC();
  }
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  /* Короткий клик-тик */
  tick() {
    if (!this.enabled || !this.tickEnabled) return;
    this.init(); this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.02);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t); osc.stop(t + 0.05);
  }
  /* Фанфары при победе */
  fanfare() {
    if (!this.enabled) return;
    this.init(); this.resume();
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);
      gain.gain.setValueAtTime(0, t + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.35);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.4);
    });
  }
  /* Звук запуска */
  whoosh() {
    if (!this.enabled) return;
    this.init(); this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.4);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  }
  /* Клик по кнопке */
  click() {
    if (!this.enabled) return;
    this.init(); this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.06);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t); osc.stop(t + 0.09);
  }
}

const sound = new SoundEngine();

/* =========================================================
   ВРАЩЕНИЕ
   ========================================================= */
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');
const speedEl = document.getElementById('speed');
const durationEl = document.getElementById('duration');
const speedVal = document.getElementById('speedVal');
const durationVal = document.getElementById('durationVal');
const soundToggle = document.getElementById('soundToggle');
const tickToggle = document.getElementById('tickToggle');

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

let lastSectorIndex = -1;

function spin() {
  if (spinning || options.length === 0) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.innerHTML = '';
  resultEl.classList.remove('pop');
  sound.whoosh();

  const n = options.length;
  const arc = (Math.PI * 2) / n;
  const targetIndex = getTargetIndex();

  // Указатель сверху => -PI/2
  const desiredCenter = -Math.PI / 2;
  const targetAngle = desiredCenter - (targetIndex * arc + arc / 2);

  const baseAngle = currentAngle % (Math.PI * 2);
  let delta = targetAngle - baseAngle;
  delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  const speedFactor = Number(speedEl.value);
  const minSpins = 3 + speedFactor;
  const extraSpins = minSpins * Math.PI * 2;

  const startAngle = currentAngle;
  const endAngle = currentAngle + delta + extraSpins;
  const duration = Math.max(2, Number(durationEl.value)) * 1000;
  const startTime = performance.now();
  lastSectorIndex = -1;

  function animate(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(t);
    currentAngle = startAngle + (endAngle - startAngle) * eased;
    drawWheel(currentAngle);

    // Тики при пересечении границы сектора
    const normalized = ((-currentAngle - Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const sectorIdx = Math.floor(normalized / arc);
    if (sectorIdx !== lastSectorIndex) {
      lastSectorIndex = sectorIdx;
      sound.tick();
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      spinBtn.disabled = false;
      finishSpin(targetIndex);
    }
  }
  requestAnimationFrame(animate);
}

function finishSpin(index) {
  const opt = options[index];
  resultEl.innerHTML = `🎉 <span style="color:${opt.color}">${opt.text}</span> 🎉`;
  resultEl.style.textShadow = `0 0 24px ${opt.color}`;
  resultEl.classList.remove('pop');
  void resultEl.offsetWidth;
  resultEl.classList.add('pop');
  sound.fanfare();

  // Конфетти-эффект (лёгкий)
  burstParticles();
}

/* Простые частицы-искры при выигрыше */
function burstParticles() {
  const wrap = document.querySelector('.wheel-wrap');
  const rect = wrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position: fixed;
      left: ${cx}px; top: ${cy}px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: hsl(${Math.random() * 360}, 90%, 60%);
      pointer-events: none;
      z-index: 50;
      box-shadow: 0 0 8px currentColor;
    `;
    document.body.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 160;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 }
    ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.4,1)' })
     .onfinish = () => p.remove();
  }
}

/* =========================================================
   ПОДКРУТКА
   ========================================================= */
const rigMode = document.getElementById('rigMode');
const rigTarget = document.getElementById('rigTarget');
const rigChance = document.getElementById('rigChance');
const secretStatus = document.getElementById('secretStatus');

function getTargetIndex() {
  if (rigMode.value === 'force') {
    const chance = Number(rigChance.value);
    if (Math.random() < chance) {
      const idx = Number(rigTarget.value);
      if (!isNaN(idx) && idx >= 0 && idx < options.length) return idx;
    }
  }
  return Math.floor(Math.random() * options.length);
}

function updateRigTargets() {
  const prev = rigTarget.value;
  rigTarget.innerHTML = '';
  options.forEach((opt, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${i + 1}. ${opt.text}`;
    rigTarget.appendChild(o);
  });
  if (prev !== '' && prev < options.length) rigTarget.value = prev;
  updateSecretStatus();
}

function updateSecretStatus() {
  if (rigMode.value === 'force' && options.length > 0) {
    const chance = Number(rigChance.value);
    const idx = Number(rigTarget.value);
    const name = options[idx] ? options[idx].text : '—';
    const pct = Math.round(chance * 100);
    secretStatus.textContent = `🎯 «${name}» — ${pct}%`;
    secretStatus.classList.remove('off');
  } else {
    secretStatus.textContent = 'Честный режим';
    secretStatus.classList.add('off');
  }
}

/* =========================================================
   РЕДАКТОР ВАРИАНТОВ
   ========================================================= */
const optionsList = document.getElementById('optionsList');
const optCounter = document.getElementById('optCounter');

function renderOptions() {
  optionsList.innerHTML = '';
  options.forEach((opt, i) => {
    const row = document.createElement('div');
    row.className = 'option-row';

    const swatch = document.createElement('input');
    swatch.type = 'color';
    swatch.value = opt.color;
    swatch.className = 'swatch';
    swatch.addEventListener('input', () => {
      options[i].color = swatch.value;
      drawWheel(currentAngle);
    });

    const text = document.createElement('input');
    text.type = 'text';
    text.value = opt.text;
    text.maxLength = 24;
    text.addEventListener('input', () => {
      options[i].text = text.value || ' ';
      drawWheel(currentAngle);
      updateRigTargets();
    });

    const del = document.createElement('button');
    del.className = 'icon-btn';
    del.textContent = '✕';
    del.title = 'Удалить';
    del.addEventListener('click', () => {
      if (options.length <= 2) { alert('Минимум 2 варианта'); return; }
      sound.click();
      options.splice(i, 1);
      renderOptions();
      drawWheel(currentAngle);
      updateRigTargets();
    });

    row.append(swatch, text, del);
    optionsList.appendChild(row);
  });

  optCounter.textContent = options.length;
  drawWheel(currentAngle);
  updateRigTargets();
}

/* =========================================================
   ПРЕСЕТЫ
   ========================================================= */
const presetsEl = document.getElementById('presets');

function renderPresets() {
  presetsEl.innerHTML = '';
  Object.entries(PRESETS).forEach(([key, preset]) => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.innerHTML = `<span class="emoji">${preset.emoji}</span>${preset.name}`;
    btn.addEventListener('click', () => {
      sound.click();
      options = JSON.parse(JSON.stringify(preset.options));
      renderOptions();
      resultEl.innerHTML = `<span class="result-placeholder">Колесо «${preset.name}» готово</span>`;
    });
    presetsEl.appendChild(btn);
  });
}

/* =========================================================
   СЕКРЕТНЫЙ ДОСТУП
   Shift + 5 кликов по логотипу
   ========================================================= */
const logo = document.getElementById('logo');
const secretPanel = document.getElementById('secretPanel');
let secretClicks = 0;
let secretTimer = null;

logo.addEventListener('click', (e) => {
  if (!e.shiftKey) return;
  secretClicks++;
  logo.classList.remove('secret-pulse');
  void logo.offsetWidth;
  logo.classList.add('secret-pulse');

  clearTimeout(secretTimer);
  secretTimer = setTimeout(() => { secretClicks = 0; }, 2000);

  if (secretClicks >= 5) {
    secretClicks = 0;
    secretPanel.classList.toggle('open');
    if (secretPanel.classList.contains('open')) {
      sound.fanfare();
    }
  }
});

document.getElementById('secretClose').addEventListener('click', () => {
  secretPanel.classList.remove('open');
});

rigMode.addEventListener('change', updateSecretStatus);
rigTarget.addEventListener('change', updateSecretStatus);
rigChance.addEventListener('change', updateSecretStatus);

document.getElementById('clearRig').addEventListener('click', () => {
  rigMode.value = 'fair';
  rigChance.value = '1';
  updateSecretStatus();
  sound.click();
});

/* =========================================================
   ОБРАБОТЧИКИ UI
   ========================================================= */
spinBtn.addEventListener('click', () => {
  sound.init(); sound.resume();
  spin();
});

document.getElementById('addOption').addEventListener('click', () => {
  if (options.length >= 16) { alert('Максимум 16 вариантов'); return; }
  const palette = ['#22c55e','#ef4444','#f59e0b','#06b6d4','#a855f7','#ec4899','#84cc16','#f97316','#14b8a6','#8b5cf6'];
  options.push({
    text: 'Вариант ' + (options.length + 1),
    color: palette[options.length % palette.length]
  });
  sound.click();
  renderOptions();
});

document.getElementById('resetOptions').addEventListener('click', () => {
  if (!confirm('Сбросить к классике?')) return;
  sound.click();
  options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
  renderOptions();
});

speedEl.addEventListener('input', () => {
  speedVal.textContent = speedEl.value;
});
durationEl.addEventListener('input', () => {
  durationVal.textContent = durationEl.value + 'с';
});

soundToggle.addEventListener('change', () => {
  sound.enabled = soundToggle.checked;
  if (sound.enabled) sound.click();
});
tickToggle.addEventListener('change', () => {
  sound.tickEnabled = tickToggle.checked;
});

/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================= */
renderPresets();
renderOptions();
