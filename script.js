/* =========================================================
   КОЛЕСО ФОРТУНЫ PRO 5.0
   Приватные колёса + редкие дропы с молнией
   ========================================================= */
'use strict';

/* ===================== КОНСТАНТЫ ===================== */
const SAVE_KEY = 'wheel_pro_v5';
const DEFAULT_PIN = '7351';
const ADMIN_SESSION_MS = 10 * 60 * 1000;

const DEFAULT_OPTIONS = [
  { text: 'Да',        color: '#22c55e', sound: 'fanfare', anim: 'pop',    type: 'normal', rare: false },
  { text: 'Нет',       color: '#ef4444', sound: 'buzz',    anim: 'shake',  type: 'normal', rare: false },
  { text: 'Возможно',  color: '#f59e0b', sound: 'chime',   anim: 'bounce', type: 'normal', rare: false },
  { text: 'Точно да',  color: '#06b6d4', sound: 'sparkle', anim: 'glow',   type: 'normal', rare: false },
  { text: 'Точно нет', color: '#a855f7', sound: 'buzz',    anim: 'shake',  type: 'normal', rare: false },
  { text: 'Повезёт',   color: '#ec4899', sound: 'fanfare', anim: 'spin',   type: 'normal', rare: false },
];

/* Улучшенное ежедневное — теперь призы ЛУЧШЕ сюрпризов */
const DAILY_OPTIONS = [
  { text: '150🪙', color: '#22c55e', sound: 'coin',    anim: 'bounce', type: 'coins', amount: 150, rare: false },
  { text: '200🪙', color: '#06b6d4', sound: 'coin',    anim: 'glow',   type: 'coins', amount: 200, rare: false },
  { text: '300🪙', color: '#f59e0b', sound: 'sparkle', anim: 'spin',   type: 'coins', amount: 300, rare: false },
  { text: '500🪙', color: '#ec4899', sound: 'fanfare', anim: 'pop',    type: 'coins', amount: 500, rare: false },
  { text: '100🪙', color: '#84cc16', sound: 'coin',    anim: 'pop',    type: 'coins', amount: 100, rare: false },
  { text: '750🪙', color: '#a855f7', sound: 'chime',   anim: 'bounce', type: 'coins', amount: 750, rare: false },
  { text: '1000🪙', color: '#ffd166', sound: 'fanfare', anim: 'glow',  type: 'coins', amount: 1000, rare: false },
  { text: '⭐×2', color: '#7ce4ff', sound: 'thunder', anim: 'lightning', type: 'coins', amount: 2000, rare: true },
];

/* Приватные колёса — НЕЛЬЗЯ ИЗМЕНИТЬ */
const PRIVATE_WHEELS = {
  binary: {
    title: '⚡ Бинарное колесо',
    desc: 'Либо удвоит баланс, либо сохранит, либо полностью сотрёт. Рискни всем!',
    options: [
      { text: '💀 ВСЁ СГОРАЕТ', color: '#7f1d1d', sound: 'thunder', anim: 'lightning', type: 'binary_wipe', rare: true },
      { text: '×2 БАЛАНС',     color: '#22c55e', sound: 'fanfare', anim: 'glow',      type: 'binary_double', rare: false },
      { text: '🔒 СОХРАНЕНО',  color: '#6b7280', sound: 'buzz',    anim: 'shake',     type: 'binary_keep', rare: false },
    ],
  },
  jackpot: {
    title: '💎 Джекпот-рулетка',
    desc: 'Шанс умножить баланс на 2, 5 или 10. Или ничего не получить.',
    options: [
      { text: '×10 ДЖЕКПОТ',  color: '#ffd166', sound: 'thunder', anim: 'lightning', type: 'jackpot_10', rare: true },
      { text: '×5',           color: '#ec4899', sound: 'fanfare', anim: 'glow',      type: 'jackpot_5',  rare: false },
      { text: '×2',           color: '#06b6d4', sound: 'sparkle', anim: 'bounce',    type: 'jackpot_2',  rare: false },
      { text: 'Пусто',        color: '#6b7280', sound: 'buzz',    anim: 'shake',     type: 'jackpot_0',  rare: false },
      { text: 'Пусто',        color: '#6b7280', sound: 'buzz',    anim: 'shake',     type: 'jackpot_0',  rare: false },
      { text: '×3',           color: '#a855f7', sound: 'chime',   anim: 'spin',      type: 'jackpot_3',  rare: false },
    ],
  },
  risk: {
    title: '🎰 Риск-казино',
    desc: 'Ставка 100🪙. Выиграешь — получишь ×3 (300🪙). Проиграешь — потеряешь ставку.',
    options: [
      { text: '🎉 ×3',      color: '#22c55e', sound: 'fanfare', anim: 'glow',      type: 'risk_win',  rare: false },
      { text: '💀 −100🪙',  color: '#7f1d1d', sound: 'buzz',    anim: 'shake',     type: 'risk_lose', rare: false },
      { text: '🎉 ×3',      color: '#22c55e', sound: 'chime',   anim: 'bounce',    type: 'risk_win',  rare: false },
      { text: '💀 −100🪙',  color: '#7f1d1d', sound: 'buzz',    anim: 'shake',     type: 'risk_lose', rare: false },
      { text: '🎉 ×5',      color: '#ffd166', sound: 'thunder', anim: 'lightning', type: 'risk_big',  rare: true },
      { text: '💀 −100🪙',  color: '#7f1d1d', sound: 'buzz',    anim: 'shake',     type: 'risk_lose', rare: false },
    ],
  },
};

const RISK_BET = 100;

const PRESETS = {
  'yes-no': { name: 'Да / Нет', emoji: '⚖️', options: [
    { text: 'Да', color: '#22c55e', sound: 'fanfare', anim: 'pop',   type: 'normal' },
    { text: 'Нет', color: '#ef4444', sound: 'buzz',    anim: 'shake', type: 'normal' },
  ]},
  'classic': { name: 'Классика', emoji: '🎯', options: DEFAULT_OPTIONS },
  'food': { name: 'Еда', emoji: '🍕', options: [
    { text: 'Пицца',    color: '#ef4444', sound: 'fanfare', anim: 'pop',    type: 'normal' },
    { text: 'Суши',     color: '#f59e0b', sound: 'chime',   anim: 'bounce', type: 'normal' },
    { text: 'Бургер',   color: '#a855f7', sound: 'drum',    anim: 'shake',  type: 'normal' },
    { text: 'Паста',    color: '#22c55e', sound: 'chime',   anim: 'glow',   type: 'normal' },
    { text: 'Салат',    color: '#84cc16', sound: 'sparkle', anim: 'pop',    type: 'normal' },
    { text: 'Шашлык',   color: '#dc2626', sound: 'drum',    anim: 'bounce', type: 'normal' },
    { text: 'Борщ',     color: '#c2410c', sound: 'chime',   anim: 'spin',   type: 'normal' },
    { text: 'Пельмени', color: '#06b6d4', sound: 'fanfare', anim: 'pop',    type: 'normal' },
  ]},
  'numbers': { name: '1 – 8', emoji: '🔢', options:
    Array.from({ length: 8 }, (_, i) => ({
      text: String(i + 1), color: `hsl(${i * 45}, 70%, 50%)`,
      sound: i % 2 === 0 ? 'fanfare' : 'chime', anim: 'pop', type: 'normal'
    }))
  },
  'truth': { name: 'Правда/Действие', emoji: '🎲', options: [
    { text: 'Правда',   color: '#06b6d4', sound: 'sparkle', anim: 'glow',   type: 'normal' },
    { text: 'Действие', color: '#ec4899', sound: 'drum',    anim: 'bounce', type: 'normal' },
    { text: 'Пропуск',  color: '#f59e0b', sound: 'buzz',    anim: 'shake',  type: 'normal' },
    { text: 'Двойной',  color: '#a855f7', sound: 'laser',   anim: 'spin',   type: 'normal' },
  ]},
  'prize': { name: 'Призы', emoji: '🎁', options: [
    { text: '100₽',    color: '#22c55e', sound: 'coin',   anim: 'pop',    type: 'normal' },
    { text: '500₽',    color: '#f59e0b', sound: 'coin',   anim: 'bounce', type: 'normal' },
    { text: '1000₽',   color: '#06b6d4', sound: 'sparkle', anim: 'glow',  type: 'normal' },
    { text: 'Пусто',   color: '#6b7280', sound: 'buzz',   anim: 'shake',  type: 'normal' },
    { text: 'Джекпот', color: '#ffd166', sound: 'fanfare', anim: 'spin',  type: 'normal' },
    { text: 'Скидка',  color: '#a855f7', sound: 'chime',  anim: 'pop',    type: 'normal' },
    { text: 'Бонус',   color: '#ec4899', sound: 'laser',  anim: 'glow',   type: 'normal' },
  ]},
};

/* Расширенный магазин — 15 предметов */
const SHOP_ITEMS = [
  // Визуальные
  { id: 'extra_theme',    icon: '🌈', name: 'Радужная тема',      price: 500,  cat: 'visual' },
  { id: 'golden_pointer', icon: '⭐', name: 'Золотая стрелка',    price: 300,  cat: 'visual' },
  { id: 'neon_style',     icon: '⚡', name: 'Неоновый стиль',      price: 350,  cat: 'visual' },
  { id: 'pastel_style',   icon: '🌸', name: 'Пастельный стиль',   price: 400,  cat: 'visual' },
  { id: 'mono_style',     icon: '⚫', name: 'Минимализм',         price: 250,  cat: 'visual' },
  { id: 'rainbow_rivets', icon: '✨', name: 'Радужные заклёпки',  price: 600,  cat: 'visual' },
  // Бусты
  { id: 'confetti',       icon: '🎉', name: 'Конфетти+',          price: 400,  cat: 'boost' },
  { id: 'double_tick',    icon: '🎵', name: 'Двойные тики',       price: 150,  cat: 'boost' },
  { id: 'double_daily',   icon: '⏰', name: '2× ежедневные',      price: 800,  cat: 'boost' },
  { id: 'extra_life',     icon: '💫', name: 'Скидка 10%',         price: 200,  cat: 'boost' },
  { id: 'no_cooldown',    icon: '🔥', name: 'Быстрый кулдаун (12ч)', price: 1500, cat: 'boost' },
  // Особые
  { id: 'lucky_charm',    icon: '🍀', name: 'Талисман удачи',     price: 1000, cat: 'special' },
  { id: 'thunder_skin',   icon: '⛈️', name: 'Громовая тема',     price: 750,  cat: 'special' },
  { id: 'golden_frame',   icon: '👑', name: 'Золотая рамка',      price: 2000, cat: 'special' },
  { id: 'vip_badge',      icon: '💎', name: 'VIP-значок',         price: 5000, cat: 'special' },
];

/* ===================== СОСТОЯНИЕ ===================== */
const state = {
  options: JSON.parse(JSON.stringify(DEFAULT_OPTIONS)),
  dailyOptions: JSON.parse(JSON.stringify(DAILY_OPTIONS)),
  currentWheel: 'main',
  angle: 0,
  spinning: false,
  lastTickIndex: -1,

  speed: 6,
  duration: 6,
  offset: 0.35,
  offsetDisabled: false,   // ← если true, стрелка всегда в центре
  direction: 'cw',
  style: 'vibrant',
  showRivets: true,
  soundEnabled: true,
  tickEnabled: true,

  rigMode: 'fair',
  rigTarget: 0,
  rigChance: 1,

  privateRig: 'fair',   // fair | win | lose
  privateVisible: { binary: true, jackpot: true, risk: true },

  balance: 100,
  lastDailySpin: 0,
  dailyCooldown: 24 * 60 * 60 * 1000,
  purchased: [],

  surpriseActive: false,
  surpriseReward: 0,

  editingSectorIndex: -1,

  stats: {
    totalSpins: 0,
    dailySpins: 0,
    privateSpins: 0,
    coinsEarned: 0,
    surprises: 0,
    rareHits: 0,
    results: {},
  },

  adminPin: DEFAULT_PIN,
  adminUnlockedUntil: 0,
  adminFailCount: 0,
  adminBlockedUntil: 0,
};

/* ===================== СОХРАНЕНИЕ ===================== */
function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      options: state.options,
      dailyOptions: state.dailyOptions,
      speed: state.speed, duration: state.duration,
      offset: state.offset, offsetDisabled: state.offsetDisabled,
      direction: state.direction, style: state.style,
      showRivets: state.showRivets, soundEnabled: state.soundEnabled,
      tickEnabled: state.tickEnabled,
      rigMode: state.rigMode, rigTarget: state.rigTarget, rigChance: state.rigChance,
      privateRig: state.privateRig,
      privateVisible: state.privateVisible,
      balance: state.balance, lastDailySpin: state.lastDailySpin,
      dailyCooldown: state.dailyCooldown,
      purchased: state.purchased, stats: state.stats, adminPin: state.adminPin,
    }));
  } catch(e) { console.warn('Save failed', e); }
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    const copyKeys = ['speed','duration','offset','direction','style','rigMode','rigTarget',
                      'rigChance','balance','lastDailySpin','dailyCooldown','adminPin','privateRig'];
    copyKeys.forEach(k => { if (d[k] !== undefined) state[k] = d[k]; });
    ['offsetDisabled','showRivets','soundEnabled','tickEnabled'].forEach(k => {
      if (typeof d[k] === 'boolean') state[k] = d[k];
    });
    if (Array.isArray(d.options) && d.options.length >= 2) state.options = d.options;
    if (Array.isArray(d.dailyOptions) && d.dailyOptions.length >= 2) state.dailyOptions = d.dailyOptions;
    if (Array.isArray(d.purchased)) state.purchased = d.purchased;
    if (d.stats) state.stats = { ...state.stats, ...d.stats };
    if (d.privateVisible) state.privateVisible = { ...state.privateVisible, ...d.privateVisible };
  } catch(e) { console.warn('Load failed', e); }
}

/* ===================== CANVAS ===================== */
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const SIZE = canvas.width;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 24;

const STYLE_MAP = {
  vibrant: (base) => ({ light: shade(base, 55), mid: base, dark: shade(base, -30), border: 'rgba(255,255,255,.5)', text: '#fff', shine: 0.2 }),
  pastel: (base) => {
    const l = lighten(desaturate(base, 40), 25);
    return { light: lighten(l, 15), mid: l, dark: desaturate(shade(l, -15), 20), border: 'rgba(255,255,255,.8)', text: '#2a2030', shine: 0.15 };
  },
  neon: (base) => ({ light: base, mid: shade(base, -10), dark: shade(base, -40), border: 'rgba(255,255,255,.9)', text: '#fff', shine: 0.4 }),
  mono: (base) => {
    const g = grayscale(base);
    return { light: shade(g, 25), mid: g, dark: shade(g, -25), border: 'rgba(255,255,255,.4)', text: '#fff', shine: 0.1 };
  },
};

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r, g, b) {
  const c = (v) => clamp(v, 0, 255) | 0;
  return '#' + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function shade(hex, p) {
  const { r, g, b } = hexToRgb(hex);
  const amt = Math.round(2.55 * p);
  return rgbToHex(r + amt, g + amt, b + amt);
}
function lighten(hex, p) { return shade(hex, p); }
function desaturate(hex, p) {
  const { r, g, b } = hexToRgb(hex);
  const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
  const a = p / 100;
  return rgbToHex(r + (gray - r) * a, g + (gray - g) * a, b + (gray - b) * a);
}
function grayscale(hex) {
  const { r, g, b } = hexToRgb(hex);
  const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
  return rgbToHex(gray, gray, gray);
}

function getCurrentOptions() {
  if (state.currentWheel === 'main') return state.options;
  if (state.currentWheel === 'daily') return state.dailyOptions;
  const priv = PRIVATE_WHEELS[state.currentWheel];
  return priv ? priv.options : state.options;
}

function drawWheel() {
  ctx.clearRect(0, 0, SIZE, SIZE);
  const opts = getCurrentOptions();
  const n = opts.length;
  if (n === 0) return;
  const arc = (Math.PI * 2) / n;
  const angle = state.angle;

  const ringGrad = ctx.createRadialGradient(CENTER, CENTER, RADIUS - 6, CENTER, CENTER, RADIUS + 16);
  ringGrad.addColorStop(0, 'rgba(255,255,255,0)');
  ringGrad.addColorStop(0.7, 'rgba(255, 209, 102, .35)');
  ringGrad.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS + 10, 0, Math.PI * 2);
  ctx.fillStyle = ringGrad;
  ctx.fill();

  const styleFn = STYLE_MAP[state.style] || STYLE_MAP.vibrant;

  for (let i = 0; i < n; i++) {
    const start = angle + i * arc;
    const end = start + arc;
    const style = styleFn(opts[i].color);

    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, start, end);
    ctx.closePath();

    const grad = ctx.createRadialGradient(CENTER, CENTER, RADIUS * 0.1, CENTER, CENTER, RADIUS);
    grad.addColorStop(0, style.light);
    grad.addColorStop(0.6, style.mid);
    grad.addColorStop(1, style.dark);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, start, end);
    ctx.closePath();
    ctx.clip();
    const shineGrad = ctx.createLinearGradient(
      CENTER + Math.cos(start) * RADIUS, CENTER + Math.sin(start) * RADIUS,
      CENTER + Math.cos(end) * RADIUS, CENTER + Math.sin(end) * RADIUS
    );
    shineGrad.addColorStop(0, `rgba(255,255,255,${style.shine})`);
    shineGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
    shineGrad.addColorStop(1, 'rgba(0,0,0,.12)');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.restore();

    // Текст
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = opts[i].rare ? '#ffd166' : style.text;
    const fs = Math.max(18, Math.min(36, 560 / n));
    ctx.font = `800 ${fs}px 'Segoe UI', sans-serif`;
    ctx.shadowColor = opts[i].rare ? '#ffd166' : 'rgba(0,0,0,.8)';
    ctx.shadowBlur = opts[i].rare ? 16 : 8;
    ctx.shadowOffsetY = 2;
    const label = opts[i].text.length > 18 ? opts[i].text.slice(0, 17) + '…' : opts[i].text;
    ctx.fillText(label, RADIUS - 30, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = 5;
  ctx.stroke();

  if (state.showRivets) {
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const x = CENTER + Math.cos(a) * (RADIUS - 10);
      const y = CENTER + Math.sin(a) * (RADIUS - 10);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, 5);
      g.addColorStop(0, '#fff');
      g.addColorStop(1, 'rgba(255,255,255,.25)');
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  const cg = ctx.createRadialGradient(CENTER - 20, CENTER - 20, 0, CENTER, CENTER, 90);
  cg.addColorStop(0, 'rgba(255,255,255,.15)');
  cg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 90, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();
}

/* ===================== ЗВУК ===================== */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.tickEnabled = true;
    this.lastTickTime = 0;
  }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) this.ctx = new AC();
  }
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  _playOsc(freq, type, dur, vol, startOffset = 0, endFreq = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + startOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
  _playNoise(dur, vol, filterFreq = 1000) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(t);
  }
  tick() {
    if (!this.enabled || !this.tickEnabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastTickTime < 0.03) return;
    this.lastTickTime = now;
    this._playOsc(1400, 'square', 0.03, 0.05, 0, 700);
  }
  whoosh() { if (!this.enabled) return; this.init(); this.resume(); this._playOsc(80, 'sawtooth', 0.5, 0.06, 0, 400); }
  click() { if (!this.enabled) return; this.init(); this.resume(); this._playOsc(800, 'sine', 0.08, 0.07, 0, 400); }

  thunder() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    // Мощный удар: низкий бас + шум + громыхание
    this._playOsc(60, 'sawtooth', 0.8, 0.25, 0, 30);
    this._playOsc(45, 'square', 1.2, 0.18, 0.1, 20);
    this._playNoise(1.5, 0.35, 800);
    // Громыхание после
    setTimeout(() => this._playNoise(2.0, 0.15, 300), 400);
    setTimeout(() => this._playNoise(1.5, 0.1, 200), 900);
    // Высокий треск
    this._playOsc(2500, 'sawtooth', 0.15, 0.12, 0, 800);
  }

  playSound(name) {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    switch (name) {
      case 'thunder': this.thunder(); break;
      case 'fanfare': {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this._playOsc(f, 'triangle', 0.35, 0.11, i * 0.09));
        break;
      }
      case 'coin': {
        this._playOsc(1800, 'sine', 0.1, 0.1);
        this._playOsc(2400, 'sine', 0.15, 0.08, 0.06);
        this._playOsc(3000, 'sine', 0.2, 0.06, 0.12);
        break;
      }
      case 'sparkle': {
        [2000, 2500, 3000, 3500, 4000].forEach((f, i) => this._playOsc(f, 'sine', 0.1, 0.06, i * 0.04));
        break;
      }
      case 'drum': {
        this._playOsc(150, 'sine', 0.3, 0.15, 0, 60);
        this._playOsc(100, 'sine', 0.4, 0.12, 0.1, 40);
        break;
      }
      case 'buzz': {
        this._playOsc(180, 'sawtooth', 0.5, 0.12, 0, 90);
        this._playOsc(120, 'square', 0.6, 0.08, 0.05, 60);
        break;
      }
      case 'chime': {
        [1046.5, 1568, 2093].forEach((f, i) => this._playOsc(f, 'sine', 0.6, 0.09, i * 0.02));
        break;
      }
      case 'laser': { this._playOsc(3000, 'sawtooth', 0.3, 0.1, 0, 200); break; }
      default: this._playOsc(880, 'triangle', 0.3, 0.1);
    }
  }
}
const sound = new SoundEngine();

/* ===================== МОЛНИЯ ===================== */
const lightningOverlay = document.getElementById('lightningOverlay');

function triggerLightning() {
  lightningOverlay.classList.add('active');
  document.body.classList.add('screen-shake');
  sound.thunder();
  setTimeout(() => {
    lightningOverlay.classList.remove('active');
    document.body.classList.remove('screen-shake');
  }, 1200);
}

/* ===================== ВРАЩЕНИЕ ===================== */
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function spin() {
  if (state.spinning) return;
  const opts = getCurrentOptions();
  if (opts.length === 0) return;

  // Кулдаун ежедневного
  if (state.currentWheel === 'daily') {
    const effectiveCooldown = state.purchased.includes('no_cooldown') ? 12 * 60 * 60 * 1000 : state.dailyCooldown;
    const timeLeft = effectiveCooldown - (Date.now() - state.lastDailySpin);
    if (timeLeft > 0) {
      alert('Ежедневное колесо доступно через ' + formatTime(timeLeft));
      return;
    }
  }

  // Ставка на риск-казино
  if (state.currentWheel === 'risk' && state.balance < RISK_BET) {
    alert(`Нужно минимум ${RISK_BET}🪙 для игры в риск-казино`);
    return;
  }

  state.spinning = true;
  spinBtn.disabled = true;
  resultEl.innerHTML = '';
  resultEl.className = 'result-box';
  sound.whoosh();
  lockControls(true);

  const n = opts.length;
  const arc = (Math.PI * 2) / n;
  const targetIndex = getTargetIndex();

  const desiredCenter = -Math.PI / 2;
  // Смещение — либо 0 (центр), либо случайный оффсет
  const offsetAngle = state.offsetDisabled ? 0
    : (state.offset - 0.5) * arc * (Math.random() < 0.5 ? 1 : -1);
  const targetAngle = desiredCenter - (targetIndex * arc + arc / 2) + offsetAngle;

  const dir = state.direction === 'cw' ? 1 : -1;
  const baseAngle = state.angle % (Math.PI * 2);
  let delta = targetAngle - baseAngle;
  if (dir > 0) delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  else delta = -((((-delta) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));

  const extraSpins = (3 + state.speed) * Math.PI * 2 * dir;
  const startAngle = state.angle;
  const endAngle = startAngle + delta + extraSpins;
  const durationMs = state.duration * 1000;
  const startTime = performance.now();
  state.lastTickIndex = -1;

  function animate(now) {
    const t = Math.min(1, (now - startTime) / durationMs);
    const eased = easeOutCubic(t);
    state.angle = startAngle + (endAngle - startAngle) * eased;
    drawWheel();

    const norm = ((-state.angle - Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const tickIdx = Math.floor(norm / arc);
    if (tickIdx !== state.lastTickIndex) {
      state.lastTickIndex = tickIdx;
      sound.tick();
    }

    if (t < 1) requestAnimationFrame(animate);
    else {
      state.spinning = false;
      spinBtn.disabled = false;
      lockControls(false);
      finishSpin(targetIndex);
    }
  }
  requestAnimationFrame(animate);
}

function lockControls(locked) {
  ['speed','duration','addOption','resetOptions','gearBtn','shopBtn',
   'wheelStyle','direction','showRivets'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = locked;
  });
  document.querySelectorAll('.tab').forEach(el => el.disabled = locked);
  document.querySelectorAll('.preset-btn').forEach(el => el.disabled = locked);
  document.querySelectorAll('.option-row').forEach(el => el.classList.toggle('disabled', locked));
}

function finishSpin(index) {
  const opts = getCurrentOptions();
  const opt = opts[index];
  if (!opt) return;

  // Статистика
  state.stats.totalSpins++;
  if (state.currentWheel === 'daily') state.stats.dailySpins++;
  if (PRIVATE_WHEELS[state.currentWheel]) state.stats.privateSpins++;
  if (opt.rare) state.stats.rareHits++;
  state.stats.results[opt.text] = (state.stats.results[opt.text] || 0) + 1;

  // Применяем эффект сектора
  applyEffect(opt);

  saveState();

  // Отображаем результат
  const color = opt.color || '#ffd166';
  resultEl.innerHTML = `${opt.rare ? '⚡' : '🎉'} <span style="color:${color}">${opt.text}</span> ${opt.rare ? '⚡' : '🎉'}`;
  resultEl.style.textShadow = `0 0 24px ${color}`;
  resultEl.className = 'result-box';

  // Редкий сектор — молния и гром, иначе обычная анимация
  if (opt.rare) {
    triggerLightning();
    resultEl.classList.add('anim-lightning');
  } else {
    const animClass = 'anim-' + (opt.anim || 'pop');
    void resultEl.offsetWidth;
    resultEl.classList.add(animClass);
  }

  // Звук (если редкий — уже сыграл гром, иначе стандартный)
  if (!opt.rare) sound.playSound(opt.sound || 'fanfare');

  burstParticles(color, opt.rare ? 60 : (state.purchased.includes('confetti') ? 48 : 24));
}

function applyEffect(opt) {
  const type = opt.type || 'normal';

  // Ежедневное — начисление
  if (state.currentWheel === 'daily' && type === 'coins') {
    let amount = opt.amount || 0;
    if (state.purchased.includes('double_daily')) amount *= 2;
    addBalance(amount);
    state.stats.coinsEarned += amount;
    state.lastDailySpin = Date.now();
    updateDailyBadge();
  }

  // Бинарное
  if (type === 'binary_double') {
    addBalance(state.balance);
  } else if (type === 'binary_wipe') {
    state.balance = 0;
    updateBalance();
    saveState();
  }
  // (binary_keep — ничего не делаем)

  // Джекпот
  if (type === 'jackpot_10') addBalance(state.balance * 9);
  if (type === 'jackpot_5')  addBalance(state.balance * 4);
  if (type === 'jackpot_3')  addBalance(state.balance * 2);
  if (type === 'jackpot_2')  addBalance(state.balance);
  // jackpot_0 — пусто

  // Риск-казино
  if (type === 'risk_win') {
    state.balance = Math.max(0, state.balance - RISK_BET + RISK_BET * 3);
    updateBalance();
  }
  if (type === 'risk_big') {
    state.balance = Math.max(0, state.balance - RISK_BET + RISK_BET * 5);
    updateBalance();
  }
  if (type === 'risk_lose') {
    state.balance = Math.max(0, state.balance - RISK_BET);
    updateBalance();
  }
}

function burstParticles(color, count = 24) {
  const wrap = document.querySelector('.wheel-wrap');
  const rect = wrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const c = i % 3 === 0 ? color : `hsl(${Math.random() * 360}, 90%, 60%)`;
    p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:8px;height:8px;border-radius:50%;background:${c};pointer-events:none;z-index:50;box-shadow:0 0 8px ${c};`;
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

function getTargetIndex() {
  const n = getCurrentOptions().length;
  const isPrivate = !!PRIVATE_WHEELS[state.currentWheel];

  // Приватная подкрутка
  if (isPrivate && state.privateRig !== 'fair') {
    // win — ищем не-проигрышный сектор
    const opts = getCurrentOptions();
    const loseTypes = ['binary_wipe', 'jackpot_0', 'risk_lose'];
    const winIndices = [];
    const loseIndices = [];
    opts.forEach((o, i) => {
      (loseTypes.includes(o.type) ? loseIndices : winIndices).push(i);
    });
    const target = state.privateRig === 'win' ? winIndices : loseIndices;
    if (target.length > 0) return target[Math.floor(Math.random() * target.length)];
  }

  // Обычная подкрутка
  if (state.rigMode === 'force' && Math.random() < state.rigChance && !isPrivate) {
    const idx = state.rigTarget;
    if (idx >= 0 && idx < n) return idx;
  }

  return Math.floor(Math.random() * n);
}

/* ===================== БАЛАНС ===================== */
const balanceEl = document.getElementById('balance');
const shopBalanceEl = document.getElementById('shopBalance');

function addBalance(amount) {
  state.balance += amount;
  if (state.balance < 0) state.balance = 0;
  saveState();
  updateBalance();
  balanceEl.animate([
    { transform: 'scale(1)', color: '#ffd166' },
    { transform: 'scale(1.4)', color: '#22c55e' },
    { transform: 'scale(1)', color: '#ffd166' }
  ], { duration: 600 });
}

function spendBalance(amount) {
  if (state.balance < amount) return false;
  state.balance -= amount;
  saveState();
  updateBalance();
  return true;
}

function updateBalance() {
  balanceEl.textContent = state.balance;
  if (shopBalanceEl) shopBalanceEl.textContent = state.balance;
  document.querySelectorAll('.shop-item .btn').forEach(btn => {
    const price = parseInt(btn.dataset.price || '0');
    btn.disabled = state.balance < price || btn.dataset.owned === '1';
  });
}

/* ===================== ЕЖЕДНЕВНОЕ ===================== */
const dailyBadge = document.getElementById('dailyBadge');
const dailyTimerEl = document.getElementById('dailyTimer');

function updateDailyBadge() {
  const effectiveCooldown = state.purchased.includes('no_cooldown') ? 12 * 60 * 60 * 1000 : state.dailyCooldown;
  const timeLeft = effectiveCooldown - (Date.now() - state.lastDailySpin);
  if (timeLeft > 0) dailyBadge.classList.remove('visible');
  else dailyBadge.classList.add('visible');
  if (dailyTimerEl) dailyTimerEl.textContent = timeLeft > 0 ? formatTime(timeLeft) : 'доступно!';
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

setInterval(updateDailyBadge, 1000);

/* ===================== ПЕРЕКЛЮЧЕНИЕ КОЛЁС ===================== */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    if (state.spinning) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.currentWheel = tab.dataset.wheel;

    const isMain = state.currentWheel === 'main';
    const isDaily = state.currentWheel === 'daily';
    const isPrivate = !!PRIVATE_WHEELS[state.currentWheel];

    document.getElementById('mainSettings').classList.toggle('hidden', !isMain);
    document.getElementById('dailySettings').classList.toggle('hidden', !isDaily);
    document.getElementById('privateSettings').classList.toggle('hidden', !isPrivate);

    if (isPrivate) {
      const priv = PRIVATE_WHEELS[state.currentWheel];
      document.getElementById('privateTitle').textContent = priv.title;
      document.getElementById('privateDesc').textContent = priv.desc;
    }

    state.angle = 0;
    drawWheel();
    sound.click();
  });
});

/* ===================== РЕДАКТОР ВАРИАНТОВ ===================== */
const optionsList = document.getElementById('optionsList');
const optCounter = document.getElementById('optCounter');

function renderOptions() {
  optionsList.innerHTML = '';
  state.options.forEach((opt, i) => {
    const row = document.createElement('div');
    row.className = 'option-row';

    const swatch = document.createElement('input');
    swatch.type = 'color';
    swatch.value = opt.color;
    swatch.className = 'swatch';
    swatch.addEventListener('input', () => { state.options[i].color = swatch.value; drawWheel(); saveState(); });

    const text = document.createElement('input');
    text.type = 'text';
    text.value = opt.text;
    text.maxLength = 24;
    text.addEventListener('input', () => {
      state.options[i].text = text.value || ' ';
      drawWheel(); updateRigTargets(); saveState();
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.textContent = opt.rare ? '⚡' : '🎨';
    editBtn.title = 'Настроить';
    editBtn.addEventListener('click', () => openSectorEditor(i));

    const del = document.createElement('button');
    del.className = 'icon-btn del';
    del.textContent = '✕';
    del.addEventListener('click', () => {
      if (state.options.length <= 2) { alert('Минимум 2'); return; }
      sound.click();
      state.options.splice(i, 1);
      renderOptions(); drawWheel(); updateRigTargets(); saveState();
    });

    row.append(swatch, text, editBtn, del);
    optionsList.appendChild(row);
  });
  optCounter.textContent = state.options.length;
  drawWheel();
  updateRigTargets();
}

function renderDailyList() {
  const el = document.getElementById('dailyList');
  el.innerHTML = '';
  state.dailyOptions.forEach(opt => {
    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `<span class="swatch" style="background:${opt.color};display:inline-block;"></span>
      <span style="flex:1;font-size:.88rem;">${opt.rare ? '⚡ ' : ''}${opt.text}</span>
      <span style="font-size:.72rem;color:var(--text-dim);">${opt.sound}</span>`;
    el.appendChild(row);
  });
}

/* ===================== РЕДАКТОР СЕКТОРА ===================== */
const sectorModal = document.getElementById('sectorModal');
const sectorText = document.getElementById('sectorText');
const sectorColor = document.getElementById('sectorColor');
const sectorSound = document.getElementById('sectorSound');
const sectorAnim = document.getElementById('sectorAnim');
const sectorRare = document.getElementById('sectorRare');

function openSectorEditor(index) {
  if (state.spinning) return;
  state.editingSectorIndex = index;
  const opt = state.options[index];
  sectorText.value = opt.text;
  sectorColor.value = opt.color;
  sectorSound.value = opt.sound || 'fanfare';
  sectorAnim.value = opt.anim || 'pop';
  sectorRare.checked = !!opt.rare;
  sectorModal.classList.add('open');
}

document.getElementById('sectorClose').addEventListener('click', () => sectorModal.classList.remove('open'));
document.getElementById('sectorCancel').addEventListener('click', () => sectorModal.classList.remove('open'));

document.getElementById('sectorSave').addEventListener('click', () => {
  const i = state.editingSectorIndex;
  if (i < 0) return;
  state.options[i].text = sectorText.value || ' ';
  state.options[i].color = sectorColor.value;
  state.options[i].sound = sectorSound.value;
  state.options[i].anim = sectorAnim.value;
  state.options[i].rare = sectorRare.checked;
  sectorModal.classList.remove('open');
  renderOptions();
  sound.click();
  saveState();
});

sectorSound.addEventListener('change', () => {
  sound.init(); sound.resume();
  sound.playSound(sectorSound.value);
});

/* ===================== ПРЕСЕТЫ ===================== */
const presetsEl = document.getElementById('presets');
function renderPresets() {
  presetsEl.innerHTML = '';
  Object.entries(PRESETS).forEach(([key, preset]) => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.innerHTML = `<span class="emoji">${preset.emoji}</span>${preset.name}`;
    btn.addEventListener('click', () => {
      if (state.spinning) return;
      sound.click();
      state.options = JSON.parse(JSON.stringify(preset.options));
      renderOptions();
      resultEl.innerHTML = `<span class="result-placeholder">Колесо «${preset.name}» готово</span>`;
      resultEl.className = 'result-box';
      saveState();
    });
    presetsEl.appendChild(btn);
  });
}

/* ===================== МАГАЗИН ===================== */
const shopModal = document.getElementById('shopModal');
const shopGrid = document.getElementById('shopGrid');
let currentCategory = 'all';

function renderShop() {
  shopGrid.innerHTML = '';
  const items = currentCategory === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.cat === currentCategory);
  items.forEach(item => {
    const owned = state.purchased.includes(item.id);
    const card = document.createElement('div');
    card.className = 'shop-item';
    card.innerHTML = `
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-price">🪙 ${item.price}</div>
      <button class="btn add small" data-price="${item.price}" data-owned="${owned ? '1' : '0'}" ${owned ? 'disabled' : ''}>
        ${owned ? '✓ Куплено' : 'Купить'}
      </button>`;
    const btn = card.querySelector('button');
    btn.addEventListener('click', () => {
      if (state.balance < item.price) { alert('Недостаточно монет'); return; }
      if (!confirm(`Купить «${item.name}» за ${item.price}🪙?`)) return;
      if (spendBalance(item.price)) {
        state.purchased.push(item.id);
        saveState();
        applyPurchase(item.id);
        renderShop();
        updateBalance();
        sound.playSound('coin');
      }
    });
    shopGrid.appendChild(card);
  });
  updateBalance();
}

document.querySelectorAll('.shop-cat').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.shop-cat').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.cat;
    renderShop();
  });
});

function applyPurchase(id) {
  switch (id) {
    case 'neon_style': state.style = 'neon'; document.getElementById('wheelStyle').value = 'neon'; drawWheel(); break;
    case 'pastel_style': state.style = 'pastel'; document.getElementById('wheelStyle').value = 'pastel'; drawWheel(); break;
    case 'mono_style': state.style = 'mono'; document.getElementById('wheelStyle').value = 'mono'; drawWheel(); break;
    case 'golden_pointer':
      document.querySelector('.pointer-body').style.background = 'radial-gradient(circle at 35% 30%, #fff, #ffd166)';
      break;
    case 'golden_frame':
      document.querySelector('.wheel-wrap').style.filter = 'drop-shadow(0 0 30px #ffd166)';
      break;
    case 'vip_badge':
      document.querySelector('.header h1').insertAdjacentHTML('beforeend', ' <span style="color:#7ce4ff;font-size:1rem;">💎</span>');
      break;
    case 'thunder_skin':
      document.querySelector('.wheel-wrap').style.filter = 'drop-shadow(0 0 20px #7ce4ff)';
      break;
  }
}

document.getElementById('shopBtn').addEventListener('click', () => {
  if (state.spinning) return;
  sound.click();
  renderShop();
  shopModal.classList.add('open');
});
document.getElementById('shopClose').addEventListener('click', () => shopModal.classList.remove('open'));
shopModal.addEventListener('click', (e) => { if (e.target === shopModal) shopModal.classList.remove('open'); });

/* ===================== СЮРПРИЗ ===================== */
const surpriseOverlay = document.getElementById('surpriseOverlay');
const surpriseText = document.getElementById('surpriseText');

function triggerSurprise() {
  if (state.surpriseActive) return;
  state.surpriseActive = true;
  state.surpriseReward = Math.floor(30 + Math.random() * 120);  // сюрпризы теперь скромнее ежедневных
  state.stats.surprises++;
  surpriseText.textContent = `Тебе начислено ${state.surpriseReward} 🪙! Забери награду.`;
  surpriseOverlay.classList.add('open');
  sound.playSound('sparkle');
  saveState();
}

document.getElementById('surpriseClaim').addEventListener('click', () => {
  addBalance(state.surpriseReward);
  state.stats.coinsEarned += state.surpriseReward;
  sound.playSound('coin');
  burstParticles('#ffd166');
  surpriseOverlay.classList.remove('open');
  state.surpriseActive = false;
  saveState();
});

function scheduleSurprise() {
  const delay = 60 * 1000 + Math.random() * 9 * 60 * 1000;
  setTimeout(() => {
    if (!state.spinning && !document.hidden) triggerSurprise();
    else setTimeout(triggerSurprise, 60 * 1000);
    scheduleSurprise();
  }, delay);
}

/* ===================== НАСТРОЙКИ UI ===================== */
document.getElementById('speed').addEventListener('input', (e) => {
  state.speed = +e.target.value;
  document.getElementById('speedVal').textContent = state.speed;
  saveState();
});
document.getElementById('duration').addEventListener('input', (e) => {
  state.duration = +e.target.value;
  document.getElementById('durationVal').textContent = state.duration + 'с';
  saveState();
});
document.getElementById('direction').addEventListener('change', (e) => { state.direction = e.target.value; saveState(); });
document.getElementById('wheelStyle').addEventListener('change', (e) => { state.style = e.target.value; drawWheel(); saveState(); });
document.getElementById('showRivets').addEventListener('change', (e) => { state.showRivets = e.target.checked; drawWheel(); saveState(); });
document.getElementById('soundToggle').addEventListener('change', (e) => {
  sound.enabled = e.target.checked;
  state.soundEnabled = e.target.checked;
  if (e.target.checked) sound.click();
  saveState();
});
document.getElementById('tickToggle').addEventListener('change', (e) => {
  sound.tickEnabled = e.target.checked;
  state.tickEnabled = e.target.checked;
  saveState();
});

/* ===================== КНОПКИ ===================== */
spinBtn.addEventListener('click', () => { sound.init(); sound.resume(); spin(); });

document.getElementById('addOption').addEventListener('click', () => {
  if (state.spinning) return;
  if (state.options.length >= 16) { alert('Максимум 16'); return; }
  const palette = ['#22c55e','#ef4444','#f59e0b','#06b6d4','#a855f7','#ec4899','#84cc16','#f97316','#14b8a6','#8b5cf6'];
  state.options.push({
    text: 'Вариант ' + (state.options.length + 1),
    color: palette[state.options.length % palette.length],
    sound: 'fanfare', anim: 'pop', type: 'normal', rare: false
  });
  sound.click();
  renderOptions();
  saveState();
});

document.getElementById('resetOptions').addEventListener('click', () => {
  if (state.spinning) return;
  if (!confirm('Сбросить к классике?')) return;
  sound.click();
  state.options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
  renderOptions();
  saveState();
});

/* ===================== ШЕСТЕРЁНКА ===================== */
const gearBtn = document.getElementById('gearBtn');
const gearPanel = document.getElementById('gearPanel');
gearBtn.addEventListener('click', () => {
  if (state.spinning) return;
  gearPanel.classList.toggle('open');
  gearBtn.classList.toggle('open');
  sound.click();
});
document.getElementById('gearClose').addEventListener('click', () => {
  gearPanel.classList.remove('open');
  gearBtn.classList.remove('open');
});

/* ===================== ЭКСПОРТ/ИМПОРТ ===================== */
function exportProgress() {
  const data = {
    version: '5.0',
    exportedAt: new Date().toISOString(),
    state: JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wheel-progress-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.state) throw new Error('Неверный формат');
      localStorage.setItem(SAVE_KEY, JSON.stringify(data.state));
      alert('✅ Импорт успешен! Перезагрузка...');
      location.reload();
    } catch(err) {
      alert('❌ Ошибка импорта: ' + err.message);
    }
  };
  reader.readAsText(file);
}

document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', (e) => {
  if (e.target.files[0]) importProgress(e.target.files[0]);
  e.target.value = '';
});

/* ===================== PIN ===================== */
const pinModal = document.getElementById('pinModal');
const pinInput = document.getElementById('pinInput');
const pinError = document.getElementById('pinError');
const secretPanel = document.getElementById('secretPanel');

function isAdminUnlocked() { return Date.now() < state.adminUnlockedUntil; }

function openPinModal() {
  if (Date.now() < state.adminBlockedUntil) {
    const left = Math.ceil((state.adminBlockedUntil - Date.now()) / 1000);
    alert(`Заблокировано. Через ${left} сек.`);
    return;
  }
  pinInput.value = '';
  pinError.textContent = '';
  pinModal.classList.add('open');
  setTimeout(() => pinInput.focus(), 100);
}

function submitPin() {
  const entered = pinInput.value.trim();
  if (!entered) { pinError.textContent = 'Введите PIN'; return; }
  if (entered === state.adminPin) {
    state.adminUnlockedUntil = Date.now() + ADMIN_SESSION_MS;
    state.adminFailCount = 0;
    pinModal.classList.remove('open');
    secretPanel.classList.add('open');
    sound.playSound('chime');
  } else {
    state.adminFailCount++;
    pinError.textContent = `Неверный PIN (${state.adminFailCount}/3)`;
    pinModal.classList.add('shake');
    setTimeout(() => pinModal.classList.remove('shake'), 400);
    pinInput.value = '';
    sound.playSound('buzz');
    if (state.adminFailCount >= 3) {
      state.adminBlockedUntil = Date.now() + 60 * 1000;
      state.adminFailCount = 0;
      pinModal.classList.remove('open');
      alert('Блокировка на 60 секунд.');
    }
  }
}

document.getElementById('pinSubmit').addEventListener('click', submitPin);
pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPin(); });
document.getElementById('pinCancel').addEventListener('click', () => pinModal.classList.remove('open'));

/* ===================== СЕКРЕТНЫЙ ЖЕСТ ===================== */
const logo = document.getElementById('logo');
let secretClicks = 0;
let secretTimer = null;

logo.addEventListener('click', (e) => {
  if (!e.shiftKey || !e.altKey) return;
  if (state.spinning) return;
  secretClicks++;
  logo.classList.remove('secret-pulse');
  void logo.offsetWidth;
  logo.classList.add('secret-pulse');
  clearTimeout(secretTimer);
  secretTimer = setTimeout(() => { secretClicks = 0; }, 1500);
  if (secretClicks >= 3) {
    secretClicks = 0;
    if (isAdminUnlocked()) secretPanel.classList.toggle('open');
    else openPinModal();
  }
});

document.getElementById('secretClose').addEventListener('click', () => secretPanel.classList.remove('open'));

/* ===================== АДМИН-ТАБЫ ===================== */
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.atab;
    document.querySelector(`.admin-content[data-acontent="${target}"]`)?.classList.add('active');
    if (target === 'stats') renderAdminStats();
    if (target === 'daily') renderAdminDaily();
    if (target === 'wallet') document.getElementById('adminBalanceSet').value = state.balance;
  });
});

/* ===================== ПОДКРУТКА + СМЕЩЕНИЕ ===================== */
const rigMode = document.getElementById('rigMode');
const rigTarget = document.getElementById('rigTarget');
const rigChance = document.getElementById('rigChance');
const secretStatus = document.getElementById('secretStatus');
const offsetRange = document.getElementById('offsetRange');
const offsetVal = document.getElementById('offsetVal');
const offsetDisabled = document.getElementById('offsetDisabled');

function updateRigTargets() {
  const prev = rigTarget.value;
  rigTarget.innerHTML = '';
  state.options.forEach((opt, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${i + 1}. ${opt.text}`;
    rigTarget.appendChild(o);
  });
  if (prev !== '' && prev < state.options.length) rigTarget.value = prev;
  else rigTarget.value = state.rigTarget;
  updateSecretStatus();
}

function updateSecretStatus() {
  if (state.rigMode === 'force' && state.options.length > 0) {
    const name = state.options[state.rigTarget]?.text || '—';
    const pct = Math.round(state.rigChance * 100);
    secretStatus.textContent = `🎯 «${name}» — ${pct}%`;
    secretStatus.classList.remove('off');
  } else {
    secretStatus.textContent = 'Честный режим';
    secretStatus.classList.add('off');
  }
}

rigMode.addEventListener('change', (e) => { state.rigMode = e.target.value; updateSecretStatus(); saveState(); });
rigTarget.addEventListener('change', (e) => { state.rigTarget = +e.target.value; updateSecretStatus(); saveState(); });
rigChance.addEventListener('change', (e) => { state.rigChance = +e.target.value; updateSecretStatus(); saveState(); });
document.getElementById('clearRig').addEventListener('click', () => {
  state.rigMode = 'fair'; state.rigChance = 1;
  rigMode.value = 'fair'; rigChance.value = '1';
  updateSecretStatus(); saveState(); sound.click();
});

// Смещение (в админке)
offsetRange.addEventListener('input', (e) => {
  state.offset = +e.target.value / 100;
  offsetVal.textContent = e.target.value + '%';
  saveState();
});
offsetDisabled.addEventListener('change', (e) => {
  state.offsetDisabled = e.target.checked;
  offsetRange.disabled = e.target.checked;
  saveState();
});

/* ===================== АДМИН: ЭКОНОМИКА ===================== */
document.getElementById('adminBalanceApply').addEventListener('click', () => {
  const val = parseInt(document.getElementById('adminBalanceSet').value);
  if (!isNaN(val) && val >= 0) {
    state.balance = val;
    saveState();
    updateBalance();
    sound.playSound('coin');
  }
});

document.querySelectorAll('[data-give]').forEach(btn => {
  btn.addEventListener('click', () => {
    const amt = parseInt(btn.dataset.give);
    state.balance = Math.max(0, state.balance + amt);
    saveState();
    updateBalance();
    sound.playSound(amt > 0 ? 'coin' : 'buzz');
  });
});

document.getElementById('adminUnlockAll').addEventListener('click', () => {
  SHOP_ITEMS.forEach(item => {
    if (!state.purchased.includes(item.id)) state.purchased.push(item.id);
  });
  saveState();
  state.purchased.forEach(id => applyPurchase(id));
  alert('Все товары разблокированы');
  sound.playSound('fanfare');
});

document.getElementById('adminResetShop').addEventListener('click', () => {
  if (!confirm('Сбросить все покупки?')) return;
  state.purchased = [];
  saveState();
  alert('Покупки сброшены');
});

/* ===================== АДМИН: ЕЖЕДНЕВНОЕ ===================== */
document.getElementById('adminResetDaily').addEventListener('click', () => {
  state.lastDailySpin = 0;
  saveState();
  updateDailyBadge();
  alert('Кулдаун сброшен');
});

document.getElementById('adminSurprise').addEventListener('click', () => {
  triggerSurprise();
});

const adminDailyList = document.getElementById('adminDailyList');

function renderAdminDaily() {
  adminDailyList.innerHTML = '';
  state.dailyOptions.forEach((opt, i) => {
    const row = document.createElement('div');
    row.className = 'admin-daily-row';

    const color = document.createElement('input');
    color.type = 'color';
    color.value = opt.color;
    color.addEventListener('input', () => {
      state.dailyOptions[i].color = color.value;
      renderDailyList(); saveState();
    });

    const txt = document.createElement('input');
    txt.type = 'text';
    txt.className = 'txt';
    txt.value = opt.text;
    txt.addEventListener('input', () => {
      state.dailyOptions[i].text = txt.value;
      renderDailyList(); saveState();
    });

    const amt = document.createElement('input');
    amt.type = 'number';
    amt.className = 'amt';
    amt.value = opt.amount || 0;
    amt.min = 0;
    amt.addEventListener('input', () => {
      state.dailyOptions[i].amount = parseInt(amt.value) || 0;
      saveState();
    });

    const del = document.createElement('button');
    del.textContent = '✕';
    del.addEventListener('click', () => {
      if (state.dailyOptions.length <= 2) { alert('Минимум 2'); return; }
      state.dailyOptions.splice(i, 1);
      renderAdminDaily(); renderDailyList(); saveState();
    });

    row.append(color, txt, amt, del);
    adminDailyList.appendChild(row);
  });
}

document.getElementById('adminDailyAdd').addEventListener('click', () => {
  state.dailyOptions.push({
    text: '400🪙', color: '#a855f7', sound: 'coin', anim: 'pop', type: 'coins', amount: 400, rare: false
  });
  renderAdminDaily(); renderDailyList(); saveState();
});

/* ===================== АДМИН: ПРИВАТНЫЕ ===================== */
document.getElementById('privateBinary').addEventListener('change', (e) => {
  state.privateVisible.binary = e.target.checked;
  document.querySelector('.tab[data-wheel="binary"]').style.display = e.target.checked ? '' : 'none';
  saveState();
});
document.getElementById('privateJackpot').addEventListener('change', (e) => {
  state.privateVisible.jackpot = e.target.checked;
  document.querySelector('.tab[data-wheel="jackpot"]').style.display = e.target.checked ? '' : 'none';
  saveState();
});
document.getElementById('privateRisk').addEventListener('change', (e) => {
  state.privateVisible.risk = e.target.checked;
  document.querySelector('.tab[data-wheel="risk"]').style.display = e.target.checked ? '' : 'none';
  saveState();
});
document.getElementById('privateRig').addEventListener('change', (e) => {
  state.privateRig = e.target.value;
  saveState();
});

/* ===================== АДМИН: СТАТИСТИКА ===================== */
function renderAdminStats() {
  document.getElementById('statSpins').textContent = state.stats.totalSpins;
  document.getElementById('statDailySpins').textContent = state.stats.dailySpins;
  document.getElementById('statCoinsEarned').textContent = state.stats.coinsEarned;
  document.getElementById('statSurprises').textContent = state.stats.surprises;
  document.getElementById('statPrivateSpins').textContent = state.stats.privateSpins;
  document.getElementById('statRare').textContent = state.stats.rareHits;

  const topEl = document.getElementById('adminTopResults');
  topEl.innerHTML = '';
  const sorted = Object.entries(state.stats.results).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (sorted.length === 0) {
    topEl.innerHTML = '<div style="color:var(--text-dim);text-align:center;padding:8px;">Пока нет данных</div>';
    return;
  }
  sorted.forEach(([text, count]) => {
    const row = document.createElement('div');
    row.className = 'admin-top-result';
    row.innerHTML = `<span>${text}</span><span class="tr-count">${count}×</span>`;
    topEl.appendChild(row);
  });
}

document.getElementById('adminResetStats').addEventListener('click', () => {
  if (!confirm('Сбросить статистику?')) return;
  state.stats = { totalSpins: 0, dailySpins: 0, privateSpins: 0, coinsEarned: 0, surprises: 0, rareHits: 0, results: {} };
  saveState();
  renderAdminStats();
});

/* ===================== АДМИН: СИСТЕМА ===================== */
document.getElementById('adminSetPin').addEventListener('click', () => {
  const newPin = document.getElementById('adminNewPin').value.trim();
  if (newPin.length < 4) { alert('PIN минимум 4 символа'); return; }
  state.adminPin = newPin;
  saveState();
  document.getElementById('adminNewPin').value = '';
  alert('PIN изменён');
});

document.getElementById('adminExport').addEventListener('click', exportProgress);
document.getElementById('adminImport').addEventListener('click', () => document.getElementById('adminImportFile').click());
document.getElementById('adminImportFile').addEventListener('change', (e) => {
  if (e.target.files[0]) importProgress(e.target.files[0]);
  e.target.value = '';
});

document.getElementById('adminHardReset').addEventListener('click', () => {
  if (!confirm('⚠️ Полный сброс прогресса. Продолжить?')) return;
  if (!confirm('Точно? Всё вернётся к заводским настройкам.')) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
});

document.getElementById('adminLogout').addEventListener('click', () => {
  state.adminUnlockedUntil = 0;
  secretPanel.classList.remove('open');
  alert('Выход из админки');
});

/* ===================== ИНИЦИАЛИЗАЦИЯ ===================== */
loadState();

sound.enabled = state.soundEnabled;
sound.tickEnabled = state.tickEnabled;

// Применяем видимость приватных колёс
['binary', 'jackpot', 'risk'].forEach(k => {
  const tab = document.querySelector(`.tab[data-wheel="${k}"]`);
  if (tab) tab.style.display = state.privateVisible[k] ? '' : 'none';
});

renderPresets();
renderOptions();
renderDailyList();
updateBalance();
updateDailyBadge();
updateRigTargets();
drawWheel();

// Применяем настройки UI
document.getElementById('speed').value = state.speed;
document.getElementById('speedVal').textContent = state.speed;
document.getElementById('duration').value = state.duration;
document.getElementById('durationVal').textContent = state.duration + 'с';
document.getElementById('direction').value = state.direction;
document.getElementById('wheelStyle').value = state.style;
document.getElementById('showRivets').checked = state.showRivets;
document.getElementById('soundToggle').checked = state.soundEnabled;
document.getElementById('tickToggle').checked = state.tickEnabled;
rigMode.value = state.rigMode;
rigChance.value = state.rigChance;
offsetRange.value = Math.round(state.offset * 100);
offsetVal.textContent = Math.round(state.offset * 100) + '%';
offsetDisabled.checked = state.offsetDisabled;
offsetRange.disabled = state.offsetDisabled;
document.getElementById('privateBinary').checked = state.privateVisible.binary;
document.getElementById('privateJackpot').checked = state.privateVisible.jackpot;
document.getElementById('privateRisk').checked = state.privateVisible.risk;
document.getElementById('privateRig').value = state.privateRig;

// Купленные товары
state.purchased.forEach(id => applyPurchase(id));

// Таймер сюрпризов
scheduleSurprise();

// Сохраняем при закрытии
window.addEventListener('beforeunload', saveState);
