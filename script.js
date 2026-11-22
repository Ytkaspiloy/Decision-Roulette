/* ===================== ДАННЫЕ ===================== */
const DEFAULT_OPTIONS = [
  { text: 'Да',        color: '#22c55e' },
  { text: 'Нет',       color: '#ef4444' },
  { text: 'Возможно',  color: '#f59e0b' },
  { text: 'Точно да',  color: '#06b6d4' },
  { text: 'Точно нет', color: '#a855f7' },
  { text: 'Повезёт',   color: '#ec4899' },
];

let options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));

/* ===================== CANVAS ===================== */
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const SIZE = canvas.width;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 10;

let currentAngle = 0;
let spinning = false;

/* Отрисовка колеса */
function drawWheel(angle) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  const n = options.length;
  if (n === 0) return;
  const arc = (Math.PI * 2) / n;

  // Внешнее свечение-обод
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS + 6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.15)';
  ctx.lineWidth = 12;
  ctx.stroke();

  // Сектора
  for (let i = 0; i < n; i++) {
    const start = angle + i * arc;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, start, end);
    ctx.closePath();

    const grad = ctx.createRadialGradient(CENTER, CENTER, RADIUS * 0.15, CENTER, CENTER, RADIUS);
    grad.addColorStop(0, shade(options[i].color, 40));
    grad.addColorStop(1, options[i].color);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Текст
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(20, Math.min(34, 520 / n))}px 'Segoe UI', sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,.6)';
    ctx.shadowBlur = 6;
    const label = options[i].text.length > 16
      ? options[i].text.slice(0, 15) + '…'
      : options[i].text;
    ctx.fillText(label, RADIUS - 24, 0);
    ctx.restore();
  }

  // Внутренний обод
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.5)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Заклёпки
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      CENTER + Math.cos(a) * (RADIUS - 6),
      CENTER + Math.sin(a) * (RADIUS - 6),
      3, 0, Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fill();
  }
}

/* Осветление/затемнение цвета */
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

/* ===================== ВРАЩЕНИЕ ===================== */
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');
const speedEl = document.getElementById('speed');
const durationEl = document.getElementById('duration');

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function spin() {
  if (spinning || options.length === 0) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = '';
  resultEl.classList.remove('pop');

  const n = options.length;
  const arc = (Math.PI * 2) / n;

  // Целевой индекс (с учётом подкрутки)
  let targetIndex = getTargetIndex();

  // Указатель сверху => угол -PI/2
  const desiredCenter = -Math.PI / 2;
  let targetAngle = desiredCenter - (targetIndex * arc + arc / 2);

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

  function animate(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(t);
    currentAngle = startAngle + (endAngle - startAngle) * eased;
    drawWheel(currentAngle);

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
  resultEl.textContent = '🎉 ' + opt.text + ' 🎉';
  resultEl.style.color = opt.color;
  resultEl.style.textShadow = `0 0 24px ${opt.color}`;
  resultEl.classList.remove('pop');
  void resultEl.offsetWidth;
  resultEl.classList.add('pop');
}

/* ===================== ПОДКРУТКА ===================== */
const rigMode = document.getElementById('rigMode');
const rigTarget = document.getElementById('rigTarget');
const rigChance = document.getElementById('rigChance');
const secretStatus = document.getElementById('secretStatus');

function getTargetIndex() {
  const mode = rigMode.value;
  if (mode === 'force') {
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
    secretStatus.textContent = `🎯 Подкрутка: «${name}» с шансом ${pct}%`;
    secretStatus.classList.remove('off');
  } else {
    secretStatus.textContent = 'Честный режим активен';
    secretStatus.classList.add('off');
  }
}

/* ===================== UI ВАРИАНТОВ ===================== */
const optionsList = document.getElementById('optionsList');

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
    text.maxLength = 20;
    text.addEventListener('input', () => {
      options[i].text = text.value || ' ';
      drawWheel(currentAngle);
      updateRigTargets();
    });

    const del = document.createElement('button');
    del.className = 'btn small danger';
    del.textContent = '✕';
    del.title = 'Удалить';
    del.addEventListener('click', () => {
      if (options.length <= 2) {
        alert('Должно остаться минимум 2 варианта');
        return;
      }
      options.splice(i, 1);
      renderOptions();
      drawWheel(currentAngle);
      updateRigTargets();
    });

    row.append(swatch, text, del);
    optionsList.appendChild(row);
  });

  drawWheel(currentAngle);
  updateRigTargets();
}

/* ===================== СОБЫТИЯ ===================== */
spinBtn.addEventListener('click', spin);

document.getElementById('addOption').addEventListener('click', () => {
  if (options.length >= 16) {
    alert('Максимум 16 вариантов');
    return;
  }
  const palette = ['#22c55e','#ef4444','#f59e0b','#06b6d4','#a855f7','#ec4899','#84cc16','#f97316','#14b8a6','#8b5cf6'];
  options.push({
    text: 'Вариант ' + (options.length + 1),
    color: palette[options.length % palette.length]
  });
  renderOptions();
});

document.getElementById('resetOptions').addEventListener('click', () => {
  if (!confirm('Сбросить все варианты к стандартным?')) return;
  options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
  renderOptions();
});

/* Секретная панель */
const secretPanel = document.getElementById('secretPanel');
document.getElementById('secretToggle').addEventListener('click', () => {
  secretPanel.classList.toggle('open');
});

rigMode.addEventListener('change', updateSecretStatus);
rigTarget.addEventListener('change', updateSecretStatus);
rigChance.addEventListener('change', updateSecretStatus);

document.getElementById('clearRig').addEventListener('click', () => {
  rigMode.value = 'fair';
  rigChance.value = '1';
  updateSecretStatus();
});

/* ===================== ИНИЦИАЛИЗАЦИЯ ===================== */
renderOptions();
