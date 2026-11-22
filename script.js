/* Вращение */
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function spin() {
  if (state.spinning) return;
  const opts = getCurrentOptions();
  if (opts.length === 0) return;

  // Проверка стоимости прокрута (для приватных)
  const priv = PRIVATE_WHEELS[state.currentWheel];
  const cost = priv?.cost || 0;
  if (cost > 0 && state.balance < cost) {
    alert(`Нужно ${cost}🪙 для прокрута`);
    return;
  }

  // Кулдаун ежедневного
  if (state.currentWheel === 'daily') {
    const effectiveCd = state.purchased.includes('no_cooldown') ? 12 * 60 * 60 * 1000 : state.dailyCooldown;
    const timeLeft = effectiveCd - (Date.now() - state.lastDailySpin);
    if (timeLeft > 0) { alert('Через ' + formatTime(timeLeft)); return; }
  }

  // Списываем стоимость сразу
  if (cost > 0) {
    if (!spendBalance(cost)) return;
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
  document.querySelectorAll('.tab, .game-tab').forEach(el => el.disabled = locked);
  document.querySelectorAll('.preset-btn').forEach(el => el.disabled = locked);
  document.querySelectorAll('.option-row').forEach(el => el.classList.toggle('disabled', locked));
}

function finishSpin(index) {
  const opts = getCurrentOptions();
  const opt = opts[index];
  if (!opt) return;

  state.stats.totalSpins++;
  if (state.currentWheel === 'daily') state.stats.dailySpins++;
  if (PRIVATE_WHEELS[state.currentWheel]) state.stats.privateSpins++;
  if (opt.rare) state.stats.rareHits++;
  state.stats.results[opt.text] = (state.stats.results[opt.text] || 0) + 1;

  applyEffect(opt);
  saveState();

  const color = opt.color || '#ffd166';
  resultEl.innerHTML = `${opt.rare ? '⚡' : '🎉'} <span style="color:${color}">${opt.text}</span> ${opt.rare ? '⚡' : '🎉'}`;
  resultEl.style.textShadow = `0 0 24px ${color}`;
  resultEl.className = 'result-box';
  if (opt.rare) {
    triggerLightning();
    resultEl.classList.add('anim-lightning');
  } else {
    const animClass = 'anim-' + (opt.anim || 'pop');
    void resultEl.offsetWidth;
    resultEl.classList.add(animClass);
  }
  if (!opt.rare) sound.playSound(opt.sound || 'fanfare');
  burstParticles(color, opt.rare ? 60 : 24);
}

function applyEffect(opt) {
  const type = opt.type || 'normal';

  if (state.currentWheel === 'daily' && type === 'coins') {
    let amount = opt.amount || 0;
    if (state.purchased.includes('double_daily') && state.applied.includes('double_daily')) amount *= 2;
    addBalance(amount);
    state.stats.coinsEarned += amount;
    state.lastDailySpin = Date.now();
    updateDailyBadge();
  }

  // Приватные — фиксированные суммы
  if (type === 'coins' && PRIVATE_WHEELS[state.currentWheel]) {
    addBalance(opt.amount || 0);
    state.stats.coinsEarned += (opt.amount || 0);
  }
  if (type === 'double') {
    addBalance(state.balance);
  }
  if (type === 'wipe') {
    state.balance = 0;
    updateBalance();
    saveState();
  }
  if (type === 'win') {
    addBalance(opt.amount || 0);
    state.stats.coinsEarned += (opt.amount || 0);
  }
  if (type === 'lose') {
    // Ставка уже списана, ничего не делаем
  }
  // keep, none — ничего
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

  if (isPrivate && state.privateRig !== 'fair') {
    const opts = getCurrentOptions();
    const loseTypes = ['wipe', 'lose', 'none'];
    const winIndices = [], loseIndices = [];
    opts.forEach((o, i) => {
      (loseTypes.includes(o.type) ? loseIndices : winIndices).push(i);
    });
    const target = state.privateRig === 'win' ? winIndices : loseIndices;
    if (target.length > 0) return target[Math.floor(Math.random() * target.length)];
  }

  if (state.rigMode === 'force' && Math.random() < state.rigChance && !isPrivate) {
    if (state.rigTarget >= 0 && state.rigTarget < n) return state.rigTarget;
  }
  return Math.floor(Math.random() * n);
}

/* Баланс */
const balanceEl = document.getElementById('balance');
function addBalance(amount) {
  state.balance += amount;
  if (state.balance < 0) state.balance = 0;
  saveState();
  updateBalance();
  balanceEl.animate([
    { transform: 'scale(1)', color: '#ffd166' },
    { transform: 'scale(1.4)', color: amount > 0 ? '#22c55e' : '#ef4444' },
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
  const shopBal = document.getElementById('shopBalance');
  if (shopBal) shopBal.textContent = state.balance;
  document.querySelectorAll('.shop-item .btn').forEach(btn => {
    const price = parseInt(btn.dataset.price || '0');
    if (price > 0) btn.disabled = state.balance < price || btn.dataset.owned === '1';
  });
}

/* Ежедневное */
const dailyBadge = document.getElementById('dailyBadge');
const dailyTimerEl = document.getElementById('dailyTimer');
function updateDailyBadge() {
  const effectiveCd = state.purchased.includes('no_cooldown') ? 12 * 60 * 60 * 1000 : state.dailyCooldown;
  const timeLeft = effectiveCd - (Date.now() - state.lastDailySpin);
  if (timeLeft > 0) dailyBadge.classList.remove('visible');
  else dailyBadge.classList.add('visible');
  if (dailyTimerEl) dailyTimerEl.textContent = timeLeft > 0 ? formatTime(timeLeft) : 'доступно!';
}
function formatTime(ms) {
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
setInterval(updateDailyBadge, 1000);

/* Переключение вкладок колёс */
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
      document.getElementById('privateCost').innerHTML =
        priv.cost > 0 ? `Стоимость прокрута: <b>${priv.cost} 🪙</b>` : 'Прокрут <b>бесплатный</b>';
    }
    state.angle = 0;
    drawWheel();
    sound.click();
  });
});

/* Переключение вкладок игр */
document.querySelectorAll('.game-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    if (state.spinning) return;
    document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const game = tab.dataset.game;
    state.currentGame = game;

    document.querySelector('.stage').style.display = game === 'wheel' ? 'flex' : 'none';
    document.getElementById('gameDice').classList.toggle('hidden', game !== 'dice');
    document.getElementById('gameGuess').classList.toggle('hidden', game !== 'guess');
    document.getElementById('gameRocket').classList.toggle('hidden', game !== 'rocket');
    sound.click();
  });
});

/* Редактор вариантов */
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

/* Редактор сектора */
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
  renderOptions(); sound.click(); saveState();
});
sectorSound.addEventListener('change', () => { sound.init(); sound.resume(); sound.playSound(sectorSound.value); });

/* Пресеты */
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
      resultEl.innerHTML = `<span class="result-placeholder">«${preset.name}»</span>`;
      resultEl.className = 'result-box';
      saveState();
    });
    presetsEl.appendChild(btn);
  });
}

/* ===================== МАГАЗИН С ПРИМЕНЕНИЕМ ===================== */
const shopModal = document.getElementById('shopModal');
const shopGrid = document.getElementById('shopGrid');
let currentCategory = 'all';

function renderShop() {
  shopGrid.innerHTML = '';
  const items = currentCategory === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.cat === currentCategory);
  items.forEach(item => {
    const owned = state.purchased.includes(item.id);
    const applied = state.applied.includes(item.id);
    const card = document.createElement('div');
    card.className = 'shop-item';
    if (owned) card.classList.add('owned');
    if (applied) card.classList.add('active-item');

    const isVisual = item.cat === 'visual';
    const isBoost = item.cat === 'boost';

    let actionBtn = '';
    if (!owned) {
      actionBtn = `<button class="btn add small buy" data-price="${item.price}" data-id="${item.id}">Купить</button>`;
    } else if (isVisual || isBoost) {
      actionBtn = applied
        ? `<button class="btn remove small toggle-apply" data-id="${item.id}">Убрать</button>`
        : `<button class="btn apply small toggle-apply" data-id="${item.id}">Применить</button>`;
    } else if (item.id === 'vip_badge' || item.id === 'golden_frame') {
      actionBtn = applied
        ? `<button class="btn remove small toggle-apply" data-id="${item.id}">Убрать</button>`
        : `<button class="btn apply small toggle-apply" data-id="${item.id}">Применить</button>`;
    } else {
      actionBtn = `<button class="btn ghost small" disabled>✓ Куплено</button>`;
    }

    card.innerHTML = `
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-price">🪙 ${item.price}</div>
      ${actionBtn}`;

    // Кнопка покупки
    card.querySelector('.buy')?.addEventListener('click', () => {
      if (state.balance < item.price) { alert('Недостаточно монет'); return; }
      if (!confirm(`Купить «${item.name}» за ${item.price}🪙?`)) return;
      if (spendBalance(item.price)) {
        state.purchased.push(item.id);
        // Визуальные и бусты — сразу применяем
        if (isVisual || isBoost || item.id === 'vip_badge' || item.id === 'golden_frame') {
          state.applied.push(item.id);
          applyItem(item.id);
        }
        saveState();
        renderShop();
        updateBalance();
        sound.playSound('coin');
      }
    });

    // Кнопка применить/убрать
    card.querySelector('.toggle-apply')?.addEventListener('click', () => {
      const idx = state.applied.indexOf(item.id);
      if (idx >= 0) {
        state.applied.splice(idx, 1);
        removeItem(item.id);
      } else {
        state.applied.push(item.id);
        applyItem(item.id);
      }
      saveState();
      renderShop();
      sound.click();
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

function applyItem(id) {
  switch (id) {
    case 'neon_style': state.style = 'neon'; document.getElementById('wheelStyle').value = 'neon'; drawWheel(); break;
    case 'pastel_style': state.style = 'pastel'; document.getElementById('wheelStyle').value = 'pastel'; drawWheel(); break;
    case 'mono_style': state.style = 'mono'; document.getElementById('wheelStyle').value = 'mono'; drawWheel(); break;
    case 'golden_pointer':
      document.querySelector('.pointer-body').style.background = 'radial-gradient(circle at 35% 30%, #fff, #ffd166)';
      document.querySelector('.pointer-tip').style.borderTopColor = '#ffd166';
      break;
    case 'golden_frame':
      document.querySelector('.wheel-wrap').style.filter = 'drop-shadow(0 0 30px #ffd166)';
      break;
    case 'thunder_skin':
      document.querySelector('.wheel-wrap').style.filter = 'drop-shadow(0 0 20px #7ce4ff)';
      break;
    case 'extra_theme': document.body.style.backgroundImage = 'radial-gradient(circle at 50% 0%, #2a1b4a 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, #1a0a2e 0%, transparent 60%), linear-gradient(160deg, #0a0618 0%, #1a1035 100%)'; break;
    case 'rainbow_rivets': break; // косметика, не критично
    case 'vip_badge':
      if (!document.querySelector('.vip-mark')) {
        document.querySelector('.header h1').insertAdjacentHTML('beforeend', ' <span class="vip-mark" style="color:#7ce4ff;font-size:1rem;">💎</span>');
      }
      break;
    case 'lucky_charm': break;
  }
}

function removeItem(id) {
  switch (id) {
    case 'neon_style': case 'pastel_style': case 'mono_style':
      // Возвращаем яркий если ничего не осталось применённым
      if (!['neon_style','pastel_style','mono_style'].some(x => state.applied.includes(x))) {
        state.style = 'vibrant';
        document.getElementById('wheelStyle').value = 'vibrant';
        drawWheel();
      }
      break;
    case 'golden_pointer':
      document.querySelector('.pointer-body').style.background = 'radial-gradient(circle at 35% 30%, #fff, #ffd166)';
      document.querySelector('.pointer-tip').style.borderTopColor = '#ffd166';
      break;
    case 'golden_frame': case 'thunder_skin':
      document.querySelector('.wheel-wrap').style.filter = '';
      break;
    case 'vip_badge':
      document.querySelector('.vip-mark')?.remove();
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

/* Сюрприз */
const surpriseOverlay = document.getElementById('surpriseOverlay');
function triggerSurprise() {
  if (state.surpriseActive) return;
  state.surpriseActive = true;
  state.surpriseReward = Math.floor(30 + Math.random() * 120);
  state.stats.surprises++;
  document.getElementById('surpriseText').textContent = `Начислено ${state.surpriseReward} 🪙!`;
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

/* Настройки */
document.getElementById('speed').addEventListener('input', e => { state.speed = +e.target.value; document.getElementById('speedVal').textContent = state.speed; saveState(); });
document.getElementById('duration').addEventListener('input', e => { state.duration = +e.target.value; document.getElementById('durationVal').textContent = state.duration + 'с'; saveState(); });
document.getElementById('direction').addEventListener('change', e => { state.direction = e.target.value; saveState(); });
document.getElementById('wheelStyle').addEventListener('change', e => { state.style = e.target.value; drawWheel(); saveState(); });
document.getElementById('showRivets').addEventListener('change', e => { state.showRivets = e.target.checked; drawWheel(); saveState(); });
document.getElementById('soundToggle').addEventListener('change', e => {
  sound.enabled = e.target.checked; state.soundEnabled = e.target.checked;
  if (e.target.checked) sound.click(); saveState();
});
document.getElementById('tickToggle').addEventListener('change', e => {
  sound.tickEnabled = e.target.checked; state.tickEnabled = e.target.checked; saveState();
});

spinBtn.addEventListener('click', () => { sound.init(); sound.resume(); spin(); });
document.getElementById('addOption').addEventListener('click', () => {
  if (state.spinning) return;
  if (state.options.length >= 16) { alert('Максимум 16'); return; }
  const palette = ['#22c55e','#ef4444','#f59e0b','#06b6d4','#a855f7','#ec4899','#84cc16','#f97316','#14b8a6','#8b5cf6'];
  state.options.push({ text: 'Вариант ' + (state.options.length + 1), color: palette[state.options.length % palette.length], sound: 'fanfare', anim: 'pop', type: 'normal', rare: false });
  sound.click(); renderOptions(); saveState();
});
document.getElementById('resetOptions').addEventListener('click', () => {
  if (state.spinning) return;
  if (!confirm('Сброс?')) return;
  sound.click();
  state.options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
  renderOptions(); saveState();
});

/* Шестерёнка */
const gearBtn = document.getElementById('gearBtn');
const gearPanel = document.getElementById('gearPanel');
gearBtn.addEventListener('click', () => { if (state.spinning) return; gearPanel.classList.toggle('open'); gearBtn.classList.toggle('open'); sound.click(); });
document.getElementById('gearClose').addEventListener('click', () => { gearPanel.classList.remove('open'); gearBtn.classList.remove('open'); });

/* Экспорт/импорт */
function exportProgress() {
  const blob = new Blob([JSON.stringify({ version: '6.0', state: JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `wheel-progress-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
}
function importProgress(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.state) throw new Error('Неверный формат');
      localStorage.setItem(SAVE_KEY, JSON.stringify(data.state));
      alert('✅ Импорт успешен!'); location.reload();
    } catch(err) { alert('❌ ' + err.message); }
  };
  reader.readAsText(file);
}
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', e => { if (e.target.files[0]) importProgress(e.target.files[0]); e.target.value = ''; });

/* PIN */
const pinModal = document.getElementById('pinModal');
const pinInput = document.getElementById('pinInput');
const pinError = document.getElementById('pinError');
const secretPanel = document.getElementById('secretPanel');
function isAdminUnlocked() { return Date.now() < state.adminUnlockedUntil; }
function openPinModal() {
  if (Date.now() < state.adminBlockedUntil) {
    alert(`Блок ${Math.ceil((state.adminBlockedUntil - Date.now()) / 1000)} сек.`);
    return;
  }
  pinInput.value = ''; pinError.textContent = '';
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
    pinError.textContent = `Неверно (${state.adminFailCount}/3)`;
    pinModal.classList.add('shake');
    setTimeout(() => pinModal.classList.remove('shake'), 400);
    pinInput.value = '';
    sound.playSound('buzz');
    if (state.adminFailCount >= 3) {
      state.adminBlockedUntil = Date.now() + 60 * 1000;
      state.adminFailCount = 0;
      pinModal.classList.remove('open');
      alert('Блок на 60 сек');
    }
  }
}
document.getElementById('pinSubmit').addEventListener('click', submitPin);
pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitPin(); });
document.getElementById('pinCancel').addEventListener('click', () => pinModal.classList.remove('open'));

/* Секретный жест */
const logo = document.getElementById('logo');
let secretClicks = 0, secretTimer = null;
logo.addEventListener('click', e => {
  if (!e.shiftKey || !e.altKey) return;
  if (state.spinning) return;
  secretClicks++;
  logo.classList.remove('secret-pulse'); void logo.offsetWidth; logo.classList.add('secret-pulse');
  clearTimeout(secretTimer);
  secretTimer = setTimeout(() => { secretClicks = 0; }, 1500);
  if (secretClicks >= 3) {
    secretClicks = 0;
    if (isAdminUnlocked()) secretPanel.classList.toggle('open');
    else openPinModal();
  }
});
document.getElementById('secretClose').addEventListener('click', () => secretPanel.classList.remove('open'));

/* Админ-табы */
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

/* Подкрутка */
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
    o.value = i; o.textContent = `${i + 1}. ${opt.text}`;
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
rigMode.addEventListener('change', e => { state.rigMode = e.target.value; updateSecretStatus(); saveState(); });
rigTarget.addEventListener('change', e => { state.rigTarget = +e.target.value; updateSecretStatus(); saveState(); });
rigChance.addEventListener('change', e => { state.rigChance = +e.target.value; updateSecretStatus(); saveState(); });
document.getElementById('clearRig').addEventListener('click', () => {
  state.rigMode = 'fair'; state.rigChance = 1;
  rigMode.value = 'fair'; rigChance.value = '1';
  updateSecretStatus(); saveState(); sound.click();
});
offsetRange.addEventListener('input', e => { state.offset = +e.target.value / 100; offsetVal.textContent = e.target.value + '%'; saveState(); });
offsetDisabled.addEventListener('change', e => { state.offsetDisabled = e.target.checked; offsetRange.disabled = e.target.checked; saveState(); });

/* Экономика админ */
document.getElementById('adminBalanceApply').addEventListener('click', () => {
  const val = parseInt(document.getElementById('adminBalanceSet').value);
  if (!isNaN(val) && val >= 0) { state.balance = val; saveState(); updateBalance(); sound.playSound('coin'); }
});
document.querySelectorAll('[data-give]').forEach(btn => {
  btn.addEventListener('click', () => {
    const amt = parseInt(btn.dataset.give);
    state.balance = Math.max(0, state.balance + amt);
    saveState(); updateBalance();
    sound.playSound(amt > 0 ? 'coin' : 'buzz');
  });
});
document.getElementById('adminUnlockAll').addEventListener('click', () => {
  SHOP_ITEMS.forEach(item => { if (!state.purchased.includes(item.id)) state.purchased.push(item.id); });
  saveState(); alert('Все товары разблокированы'); sound.playSound('fanfare');
});
document.getElementById('adminResetShop').addEventListener('click', () => {
  if (!confirm('Сбросить покупки?')) return;
  state.purchased = []; state.applied = []; saveState(); alert('Сброшено');
});

/* Ежедневное админ */
document.getElementById('adminResetDaily').addEventListener('click', () => { state.lastDailySpin = 0; saveState(); updateDailyBadge(); alert('Сброшено'); });
document.getElementById('adminSurprise').addEventListener('click', triggerSurprise);

const adminDailyList = document.getElementById('adminDailyList');
function renderAdminDaily() {
  adminDailyList.innerHTML = '';
  state.dailyOptions.forEach((opt, i) => {
    const row = document.createElement('div');
    row.className = 'admin-daily-row';
    const color = document.createElement('input');
    color.type = 'color'; color.value = opt.color;
    color.addEventListener('input', () => { state.dailyOptions[i].color = color.value; renderDailyList(); saveState(); });
    const txt = document.createElement('input');
    txt.type = 'text'; txt.className = 'txt'; txt.value = opt.text;
    txt.addEventListener('input', () => { state.dailyOptions[i].text = txt.value; renderDailyList(); saveState(); });
    const amt = document.createElement('input');
    amt.type = 'number'; amt.className = 'amt'; amt.value = opt.amount || 0; amt.min = 0;
    amt.addEventListener('input', () => { state.dailyOptions[i].amount = parseInt(amt.value) || 0; saveState(); });
    const del = document.createElement('button');
    del.textContent = '✕';
    del.addEventListener('click', () => {
      if (state.dailyOptions.length <= 2) { alert('Минимум 2'); return; }
      state.dailyOptions.splice(i, 1); renderAdminDaily(); renderDailyList(); saveState();
    });
    row.append(color, txt, amt, del);
    adminDailyList.appendChild(row);
  });
}
document.getElementById('adminDailyAdd').addEventListener('click', () => {
  state.dailyOptions.push({ text: '400🪙', color: '#a855f7', sound: 'coin', anim: 'pop', type: 'coins', amount: 400, rare: false });
  renderAdminDaily(); renderDailyList(); saveState();
});

/* Приватные */
['binary','jackpot','risk','whale','legend'].forEach(k => {
  const el = document.getElementById('private' + k.charAt(0).toUpperCase() + k.slice(1));
  if (el) el.addEventListener('change', e => {
    state.privateVisible[k] = e.target.checked;
    const tab = document.querySelector(`.tab[data-wheel="${k}"]`);
    if (tab) tab.style.display = e.target.checked ? '' : 'none';
    saveState();
  });
});
document.getElementById('privateRig').addEventListener('change', e => { state.privateRig = e.target.value; saveState(); });

/* Игровая подкрутка */
['dice','guess','rocket'].forEach(g => {
  const el = document.getElementById('game' + g.charAt(0).toUpperCase() + g.slice(1) + 'Rig');
  if (el) el.addEventListener('change', e => { state.gameRigs[g] = e.target.value; saveState(); });
});

/* Статистика */
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
    topEl.innerHTML = '<div style="color:var(--text-dim);text-align:center;padding:8px;">Пусто</div>';
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
  if (!confirm('Сброс?')) return;
  state.stats = { totalSpins: 0, dailySpins: 0, privateSpins: 0, coinsEarned: 0, surprises: 0, rareHits: 0, results: {} };
  saveState(); renderAdminStats();
});

/* Система */
document.getElementById('adminSetPin').addEventListener('click', () => {
  const np = document.getElementById('adminNewPin').value.trim();
  if (np.length < 4) { alert('Минимум 4'); return; }
  state.adminPin = np; saveState();
  document.getElementById('adminNewPin').value = ''; alert('PIN изменён');
});
document.getElementById('adminExport').addEventListener('click', exportProgress);
document.getElementById('adminImport').addEventListener('click', () => document.getElementById('adminImportFile').click());
document.getElementById('adminImportFile').addEventListener('change', e => { if (e.target.files[0]) importProgress(e.target.files[0]); e.target.value = ''; });
document.getElementById('adminHardReset').addEventListener('click', () => {
  if (!confirm('Полный сброс?')) return;
  if (!confirm('Точно?')) return;
  localStorage.removeItem(SAVE_KEY); location.reload();
});
document.getElementById('adminLogout').addEventListener('click', () => {
  state.adminUnlockedUntil = 0; secretPanel.classList.remove('open'); alert('Выход');
});

/* ===================== МИНИ-ИГРЫ ===================== */

/* Кубик */
const diceDisplay = document.getElementById('diceDisplay');
const diceResult = document.getElementById('diceResult');
const diceFaces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
let dicePlaying = false;

document.getElementById('diceLow').addEventListener('click', () => playDice('low'));
document.getElementById('diceHigh').addEventListener('click', () => playDice('high'));

function playDice(bet) {
  if (dicePlaying) return;
  const amount = parseInt(document.getElementById('diceBet').value) || 0;
  if (amount < 10) { diceResult.textContent = 'Минимальная ставка 10🪙'; diceResult.className = 'game-result lose'; return; }
  if (state.balance < amount) { diceResult.textContent = 'Недостаточно монет'; diceResult.className = 'game-result lose'; return; }

  spendBalance(amount);
  dicePlaying = true;
  diceResult.textContent = '';
  diceDisplay.classList.add('rolling');

  const rig = state.gameRigs.dice;
  let roll;
  // Определяем результат с учётом подкрутки
  // Условие выигрыша: low → roll < 4, high → roll > 4
  if (rig === 'win') {
    const winRolls = bet === 'low' ? [1,2,3] : [5,6];
    roll = winRolls[Math.floor(Math.random() * winRolls.length)];
  } else if (rig === 'lose') {
    const loseRolls = bet === 'low' ? [4,5,6] : [1,2,3,4];
    roll = loseRolls[Math.floor(Math.random() * loseRolls.length)];
  } else {
    roll = 1 + Math.floor(Math.random() * 6);
  }

  // Анимация
  let frame = 0;
  const interval = setInterval(() => {
    diceDisplay.textContent = diceFaces[Math.floor(Math.random() * 6)];
    frame++;
    if (frame > 15) {
      clearInterval(interval);
      diceDisplay.classList.remove('rolling');
      diceDisplay.textContent = diceFaces[roll - 1];

      const win = (bet === 'low' && roll < 4) || (bet === 'high' && roll > 4);
      if (win) {
        const payout = Math.round(amount * 1.9);
        addBalance(payout);
        diceResult.textContent = `🎉 Выпало ${roll}. Выиграл ${payout}🪙!`;
        diceResult.className = 'game-result win';
        sound.playSound('coin');
      } else {
        diceResult.textContent = `💀 Выпало ${roll}. Потерял ${amount}🪙`;
        diceResult.className = 'game-result lose';
        sound.playSound('buzz');
      }
      dicePlaying = false;
      saveState();
    }
  }, 60);
}

/* Угадай число */
const guessGrid = document.getElementById('guessGrid');
const guessResult = document.getElementById('guessResult');
let guessPlaying = false;

function buildGuessGrid() {
  guessGrid.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guess-btn';
    btn.textContent = i;
    btn.addEventListener('click', () => playGuess(i));
    guessGrid.appendChild(btn);
  }
}

function playGuess(num) {
  if (guessPlaying) return;
  const amount = parseInt(document.getElementById('guessBet').value) || 0;
  if (amount < 10) { guessResult.textContent = 'Минимальная ставка 10🪙'; guessResult.className = 'game-result lose'; return; }
  if (state.balance < amount) { guessResult.textContent = 'Недостаточно монет'; guessResult.className = 'game-result lose'; return; }

  spendBalance(amount);
  guessPlaying = true;
  guessResult.textContent = '';
  document.querySelectorAll('.guess-btn').forEach(b => b.disabled = true);

  const rig = state.gameRigs.guess;
  let secret;
  if (rig === 'win') secret = num;
  else if (rig === 'lose') {
    do { secret = 1 + Math.floor(Math.random() * 10); } while (secret === num);
  } else {
    secret = 1 + Math.floor(Math.random() * 10);
  }

  const win = secret === num;
  const allBtns = guessGrid.querySelectorAll('.guess-btn');
  allBtns[secret - 1].classList.add('correct');
  if (!win) allBtns[num - 1].classList.add('wrong');

  if (win) {
    const payout = amount * 8;
    addBalance(payout);
    guessResult.textContent = `🎉 Угадал! Число было ${secret}. Получил ${payout}🪙!`;
    guessResult.className = 'game-result win';
    sound.playSound('thunder');
    triggerLightning();
  } else {
    guessResult.textContent = `💀 Не угадал. Было ${secret}. Потерял ${amount}🪙`;
    guessResult.className = 'game-result lose';
    sound.playSound('buzz');
  }

  setTimeout(() => {
    document.querySelectorAll('.guess-btn').forEach(b => { b.disabled = false; b.classList.remove('correct', 'wrong'); });
    guessPlaying = false;
    saveState();
  }, 2500);
}

/* Ракета */
const rocketMult = document.getElementById('rocketMult');
const rocketEl = document.getElementById('rocket');
const rocketResult = document.getElementById('rocketResult');
let rocketPlaying = false;

function playRocket(targetMult) {
  if (rocketPlaying) return;
  const amount = parseInt(document.getElementById('rocketBet').value) || 0;
  if (amount < 10) { rocketResult.textContent = 'Минимальная ставка 10🪙'; rocketResult.className = 'game-result lose'; return; }
  if (state.balance < amount) { rocketResult.textContent = 'Недостаточно монет'; rocketResult.className = 'game-result lose'; return; }

  spendBalance(amount);
  rocketPlaying = true;
  rocketResult.textContent = '';
  rocketMult.classList.remove('exploded');
  rocketEl.style.left = '0%';
  rocketEl.style.opacity = '1';
  rocketEl.classList.remove('exploding');

  // Шанс выигрыша (соответствует отображённым процентам)
  const chances = { 1.5: 0.8, 2: 0.6, 3: 0.4, 5: 0.2, 10: 0.08, 25: 0.03 };
  const chance = chances[targetMult] || 0.5;

  const rig = state.gameRigs.rocket;
  let willWin;
  if (rig === 'win') willWin = true;
  else if (rig === 'lose') willWin = false;
  else willWin = Math.random() < chance;

  // Итоговый множитель, до которого "долетит" ракета
  const maxMult = willWin
    ? targetMult + Math.random() * targetMult * 0.5
    : 1 + Math.random() * (targetMult - 1);

  let currentMult = 1;
  const speed = 0.04;
  const interval = setInterval(() => {
    currentMult += speed;
    rocketMult.textContent = '×' + currentMult.toFixed(2);
    // Прогресс до целевого множителя
    const progress = Math.min(1, currentMult / maxMult);
    rocketEl.style.left = (progress * 100) + '%';

    if (currentMult >= maxMult) {
      clearInterval(interval);

      if (willWin) {
        const payout = Math.round(amount * targetMult);
        addBalance(payout);
        rocketMult.textContent = '×' + targetMult.toFixed(2);
        rocketResult.textContent = `🚀 Долетела! Получил ${payout}🪙`;
        rocketResult.className = 'game-result win';
        sound.playSound('fanfare');
        burstParticles('#ffd166', 30);
      } else {
        rocketMult.textContent = '💥 ВЗРЫВ ×' + currentMult.toFixed(2);
        rocketMult.classList.add('exploded');
        rocketEl.classList.add('exploding');
        rocketEl.style.opacity = '0';
        rocketResult.textContent = `💀 Ракета взорвалась. Потерял ${amount}🪙`;
        rocketResult.className = 'game-result lose';
        sound.playSound('thunder');
        triggerLightning();
      }
      rocketPlaying = false;
      saveState();
    }
  }, 50);
}

document.querySelectorAll('.rocket-target').forEach(btn => {
  btn.addEventListener('click', () => playRocket(parseFloat(btn.dataset.mult)));
});

/* Инициализация */
loadState();
sound.enabled = state.soundEnabled;
sound.tickEnabled = state.tickEnabled;

['binary','jackpot','risk','whale','legend'].forEach(k => {
  const tab = document.querySelector(`.tab[data-wheel="${k}"]`);
  if (tab) tab.style.display = state.privateVisible[k] ? '' : 'none';
  const chk = document.getElementById('private' + k.charAt(0).toUpperCase() + k.slice(1));
  if (chk) chk.checked = state.privateVisible[k];
});

renderPresets();
renderOptions();
renderDailyList();
updateBalance();
updateDailyBadge();
updateRigTargets();
drawWheel();
buildGuessGrid();

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
document.getElementById('privateRig').value = state.privateRig;
document.getElementById('gameDiceRig').value = state.gameRigs.dice;
document.getElementById('gameGuessRig').value = state.gameRigs.guess;
document.getElementById('gameRocketRig').value = state.gameRigs.rocket;

// Применяем активные предметы
state.applied.forEach(id => applyItem(id));

scheduleSurprise();
window.addEventListener('beforeunload', saveState);
