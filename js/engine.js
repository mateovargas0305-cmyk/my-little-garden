// ============ MOTOR DEL JUEGO ============

const scene = document.getElementById('scene');
const bg = document.getElementById('bg');
const ctx = bg.getContext('2d');
const weatherCanvas = document.getElementById('weather');
const wctx = weatherCanvas.getContext('2d');
const toast = document.getElementById('toast');
const nightTint = document.getElementById('nightTint');

let W, H;
let animals = [];
let foodItems = [];
let toys = [];
let lastTime = 0;

let activeKeys = new Set();
try {
  const stored = JSON.parse(localStorage.getItem('active_animals') || 'null');
  if (Array.isArray(stored)) activeKeys = new Set(stored);
  else ANIMAL_DATA.forEach(a => activeKeys.add(a.key));
} catch(e) {
  ANIMAL_DATA.forEach(a => activeKeys.add(a.key));
}

let currentTime = 'DAY';
let currentWeather = 'CLEAR';
let weatherChangeAt = 0;

function getCurrentTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 6 && h < 8) return 'DAWN';
  if (h >= 8 && h < 18) return 'DAY';
  if (h >= 18 && h < 20) return 'SUNSET';
  return 'NIGHT';
}

function pickRandomWeather() {
  const r = Math.random();
  if (r < 0.45) return 'CLEAR';
  if (r < 0.75) return 'CLOUDY';
  if (r < 0.90) return 'RAIN';
  if (r < 0.97) return 'SNOW';
  return 'STORM';
}

function maybeChangeWeather() {
  const now = Date.now();
  if (now > weatherChangeAt) {
    const newW = pickRandomWeather();
    if (newW !== currentWeather) {
      currentWeather = newW;
      const wInfo = WEATHERS[currentWeather];
      showToast(wInfo.emoji + ' ' + wInfo.name);
    }
    weatherChangeAt = now + (3 + Math.random() * 5) * 60 * 1000;
  }
}

function updateTimeOfDay() {
  const t = getCurrentTimeOfDay();
  if (t !== currentTime) currentTime = t;
  let tint = 'transparent';
  if (currentTime === 'NIGHT') tint = 'rgba(20, 30, 80, 0.45)';
  else if (currentTime === 'SUNSET') tint = 'rgba(255, 120, 60, 0.18)';
  else if (currentTime === 'DAWN') tint = 'rgba(255, 180, 200, 0.18)';
  nightTint.style.background = tint;
  const tInfo = TIMES[currentTime];
  const wInfo = WEATHERS[currentWeather];
  document.getElementById('timeWeather').textContent = tInfo.emoji + ' ' + tInfo.name + '  ·  ' + wInfo.emoji + ' ' + wInfo.name;
}

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  bg.width = W; bg.height = H;
  weatherCanvas.width = W; weatherCanvas.height = H;
  generateBackground();
  drawBackground();
  animals.forEach(a => {
    if (a.x > W - 50) a.x = W - 100;
    if (a.y > H - 100) a.y = H - 150;
  });
  const track = document.getElementById('raceTrack');
  track.style.top = (H * 0.35) + 'px';
  track.style.height = (H * 0.45) + 'px';
}
window.addEventListener('resize', resize);

let flores = [];
let pastoDots = [];
let stars = [];

function generateBackground() {
  flores = []; pastoDots = []; stars = [];
  const colores = ['#ff6b9d', '#ffeb3b', '#ffffff', '#a78bfa', '#ff8a65', '#f48fb1'];
  const numFlores = Math.floor((W * H) / 18000);
  for (let i = 0; i < numFlores; i++) {
    flores.push({
      x: Math.random() * W,
      y: Math.random() * H,
      c: colores[Math.floor(Math.random() * colores.length)],
      tipo: Math.floor(Math.random() * 3),
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.8,
    });
  }
  const numDots = Math.floor((W * H) / 1500);
  for (let i = 0; i < numDots; i++) {
    pastoDots.push({
      x: Math.random() * W,
      y: Math.random() * H,
      shade: Math.random() < 0.5 ? '#6ab048' : '#8dd05e',
    });
  }
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.55,
      brightness: 0.3 + Math.random() * 0.7,
      twinkle: Math.random() * Math.PI * 2,
    });
  }
}

function drawBackground() {
  let topColor, bottomColor;
  if (currentTime === 'DAWN') { topColor = '#ffb3a7'; bottomColor = '#9ed369'; }
  else if (currentTime === 'DAY') { topColor = '#8dd05e'; bottomColor = '#6ab048'; }
  else if (currentTime === 'SUNSET') { topColor = '#ff9966'; bottomColor = '#7fa84e'; }
  else { topColor = '#1a2050'; bottomColor = '#3a5530'; }
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  
  if (currentTime === 'NIGHT') {
    ctx.fillStyle = 'white';
    const t = Date.now() / 1000;
    for (const s of stars) {
      const flicker = 0.6 + 0.4 * Math.sin(t * 2 + s.twinkle);
      ctx.globalAlpha = s.brightness * flicker;
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fffacd';
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.15, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200, 200, 180, 0.4)';
    ctx.beginPath();
    ctx.arc(W * 0.85 + 6, H * 0.15 - 4, 6, 0, Math.PI * 2);
    ctx.arc(W * 0.85 - 4, H * 0.15 + 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (currentTime === 'DAWN' || currentTime === 'SUNSET') {
    const sunY = currentTime === 'DAWN' ? H * 0.25 : H * 0.20;
    const sunColor = currentTime === 'DAWN' ? '#ffeb99' : '#ffaa55';
    ctx.fillStyle = sunColor;
    ctx.beginPath();
    ctx.arc(W * 0.78, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = currentTime === 'DAWN' ? 'rgba(255,235,153,0.2)' : 'rgba(255,170,85,0.25)';
    ctx.beginPath();
    ctx.arc(W * 0.78, sunY, 50, 0, Math.PI * 2);
    ctx.fill();
  }
  
  for (const d of pastoDots) {
    ctx.fillStyle = d.shade;
    ctx.fillRect(d.x, d.y, 2, 2);
  }
  const swayT = Date.now() / 800;
  for (const f of flores) {
    const sway = Math.sin(swayT * f.speed + f.phase) * 2;
    drawFlower(f.x + sway, f.y, f.c, f.tipo);
  }
}

function drawFlower(x, y, color, tipo) {
  ctx.fillStyle = color;
  if (tipo === 0) {
    ctx.fillRect(x-1, y-3, 2, 7);
    ctx.fillRect(x-3, y-1, 7, 2);
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(x-1, y-1, 2, 2);
  } else if (tipo === 1) {
    ctx.fillRect(x-2, y-2, 5, 5);
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(x, y, 1, 1);
  } else {
    ctx.fillStyle = '#4a8c34';
    ctx.fillRect(x, y, 1, 4);
    ctx.fillStyle = color;
    ctx.fillRect(x-2, y-3, 5, 4);
  }
}

let weatherParticles = [];

function ensureWeatherParticles() {
  let target = 0;
  if (currentWeather === 'RAIN') target = 80;
  else if (currentWeather === 'STORM') target = 130;
  else if (currentWeather === 'SNOW') target = 60;
  else target = 0;
  while (weatherParticles.length < target) {
    weatherParticles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 0, vy: 0,
      type: currentWeather,
    });
  }
  if (weatherParticles.length > target) weatherParticles.length = target;
}

let lastLightning = 0;

function drawWeather(dt) {
  wctx.clearRect(0, 0, W, H);
  ensureWeatherParticles();
  
  if (['CLOUDY','RAIN','STORM','SNOW'].includes(currentWeather)) {
    const t = Date.now() / 30000;
    for (let i = 0; i < 3; i++) {
      const cx = ((t * (i+1) * 100) + i * W * 0.4) % (W + 200) - 100;
      const cy = 30 + i * 40;
      drawCloud(cx, cy, currentWeather === 'STORM' ? '#3a3a4a' : '#e8e8f0');
    }
  }
  
  if (currentWeather === 'RAIN' || currentWeather === 'STORM') {
    wctx.strokeStyle = currentWeather === 'STORM' ? 'rgba(180,200,220,0.7)' : 'rgba(150,200,255,0.6)';
    wctx.lineWidth = 2;
    const speedY = currentWeather === 'STORM' ? 700 : 500;
    const slant = currentWeather === 'STORM' ? -3 : -1.5;
    for (const p of weatherParticles) {
      p.y += speedY * dt;
      p.x += slant * 50 * dt;
      if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      wctx.beginPath();
      wctx.moveTo(p.x, p.y);
      wctx.lineTo(p.x + slant*4, p.y + 12);
      wctx.stroke();
    }
    if (currentWeather === 'STORM' && Date.now() - lastLightning > 3000 && Math.random() < 0.005) {
      lastLightning = Date.now();
      flashLightning();
    }
  } else if (currentWeather === 'SNOW') {
    wctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (const p of weatherParticles) {
      p.y += 60 * dt;
      p.x += Math.sin(Date.now()/1000 + p.y * 0.01) * 30 * dt;
      if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      wctx.beginPath();
      wctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      wctx.fill();
    }
  }
}

function drawCloud(x, y, color) {
  wctx.fillStyle = color;
  wctx.globalAlpha = 0.85;
  wctx.beginPath();
  wctx.arc(x, y, 18, 0, Math.PI * 2);
  wctx.arc(x + 22, y - 6, 22, 0, Math.PI * 2);
  wctx.arc(x + 44, y, 18, 0, Math.PI * 2);
  wctx.arc(x + 30, y + 8, 18, 0, Math.PI * 2);
  wctx.fill();
  wctx.globalAlpha = 1;
}

function flashLightning() {
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:white;z-index:6;pointer-events:none;animation:flashAnim 0.4s ease-out;';
  document.body.appendChild(flash);
  if (!document.getElementById('flashStyle')) {
    const s = document.createElement('style');
    s.id = 'flashStyle';
    s.textContent = '@keyframes flashAnim { 0%{opacity:0;} 10%{opacity:0.85;} 100%{opacity:0;} }';
    document.head.appendChild(s);
  }
  setTimeout(() => flash.remove(), 400);
}

function perspectiveScale(y) {
  // Animals higher on screen (smaller y) appear smaller; at bottom they're full size
  const minScale = 0.55;
  const topMargin = 110;
  const bottomMargin = H - 80;
  const t = Math.max(0, Math.min(1, (y - topMargin) / (bottomMargin - topMargin)));
  return minScale + (1 - minScale) * t;
}

function rebuildAnimals() {
  animals.forEach(a => {
    if (a._ecstasyHearts) { clearInterval(a._ecstasyHearts); a._ecstasyHearts = null; }
    a.el.remove();
    if (a.zEl) a.zEl.remove();
    if (a.shadowEl) a.shadowEl.remove();
  });
  animals = [];
  ANIMAL_DATA.forEach((data) => {
    if (!activeKeys.has(data.key)) return;
    const img = new Image();
    img.src = data.src;
    const el = document.createElement('img');
    el.src = data.src;
    el.className = 'animal';
    el.alt = data.name;
    const animal = {
      ...data,
      el, img,
      x: Math.random() * (W - 120) + 30,
      y: Math.random() * (H - 280) + 130,
      vx: 0, vy: 0,
      dir: Math.random() < 0.5 ? 1 : -1,
      state: STATES.IDLE,
      stateTime: Math.random() * 3,
      bobOffset: Math.random() * Math.PI * 2,
      target: null,
      happyTime: 0,
      currentSrc: 'walk',
      zEl: null,
      shadowEl: null,
      ecstasyTime: 0,
    };
    const shadowEl = document.createElement('div');
    shadowEl.className = 'animal-shadow';
    scene.appendChild(shadowEl);
    animal.shadowEl = shadowEl;
    img.onload = () => {
      const baseW = img.naturalWidth;
      const baseH = img.naturalHeight;
      const targetW = Math.min(W, H) * 0.20 * animal.scale;
      const factor = targetW / baseW;
      animal.baseW = baseW * factor;
      animal.baseH = baseH * factor;
      animal.w = animal.baseW;
      animal.h = animal.baseH;
      el.style.width = animal.w + 'px';
      el.style.height = animal.h + 'px';
    };
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      petAnimal(animal);
    });
    let pressTimer = null;
    let activePointerId = null;
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      activePointerId = e.pointerId;
      el.setPointerCapture(e.pointerId); // capturar el puntero para no perderlo aunque se mueva
      pressTimer = setTimeout(() => { startEcstasy(animal); }, 400);
    });
    const cancelPress = (e) => {
      if (e && e.pointerId !== activePointerId) return;
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      if (activePointerId !== null) { try { el.releasePointerCapture(activePointerId); } catch(_) {} }
      activePointerId = null;
      stopEcstasy(animal);
    };
    el.addEventListener('pointerup', cancelPress);
    el.addEventListener('pointercancel', cancelPress);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    // NO usamos pointerleave — con setPointerCapture el puntero queda capturado
    // aunque el dedo se mueva fuera del elemento
    scene.appendChild(el);
    animals.push(animal);
  });
}

function setSprite(a, type) {
  if (a.currentSrc === type) return;
  a.currentSrc = type;
  const newSrc = type === 'sleep' ? a.srcSleep : a.src;
  a.el.src = newSrc;
  const img = new Image();
  img.onload = () => {
    const baseW = img.naturalWidth;
    const baseH = img.naturalHeight;
    const targetW = Math.min(W, H) * 0.20 * a.scale;
    const factor = targetW / baseW;
    a.w = baseW * factor;
    a.h = baseH * factor;
    a.el.style.width = a.w + 'px';
    a.el.style.height = a.h + 'px';
  };
  img.src = newSrc;
}

function showZ(a) {
  if (a.zEl) return;
  const z = document.createElement('div');
  z.className = 'zzz';
  z.textContent = 'z';
  z.style.left = (a.x + a.w * 0.7) + 'px';
  z.style.top = (a.y - 5) + 'px';
  scene.appendChild(z);
  a.zEl = z;
}
function hideZ(a) {
  if (a.zEl) { a.zEl.remove(); a.zEl = null; }
}

function petAnimal(a) {
  if (a.state === STATES.SLEEP) {
    a.state = STATES.IDLE;
    a.stateTime = 1;
    setSprite(a, 'walk');
    hideZ(a);
    showFloating(a.x + a.w/2, a.y, '😺');
    return;
  }
  if (a.state === STATES.ECSTASY) return;
  a.happyTime = 2;
  a.el.classList.add('happy');
  setTimeout(() => a.el.classList.remove('happy'), 1500);
  showFloating(a.x + a.w/2, a.y, '💕');
  showToast(a.name + ': ' + a.sound);
  a.state = STATES.IDLE;
  a.stateTime = 1.5;
  a.vx = 0; a.vy = 0;
  a.target = null;
  trackStat('pets');
}

function startEcstasy(a) {
  if (a.state === STATES.SLEEP) {
    setSprite(a, 'walk');
    hideZ(a);
  }
  a.state = STATES.ECSTASY;
  a.ecstasyTime = 999;
  a.vx = 0; a.vy = 0;
  a.target = null;
  a.el.classList.add('ecstasy');
  trackStat('ecstasy');
  a.el.style.setProperty('--dir', a.dir);
  if (!a._ecstasyHearts) {
    a._ecstasyHearts = setInterval(() => {
      if (a.state !== STATES.ECSTASY) {
        clearInterval(a._ecstasyHearts);
        a._ecstasyHearts = null;
        return;
      }
      const emojis = ['💕','💖','💗','✨'];
      showFloating(a.x + Math.random() * a.w, a.y - 5, emojis[Math.floor(Math.random()*4)]);
    }, 350);
  }
}

function stopEcstasy(a) {
  if (a.state !== STATES.ECSTASY) return;
  a.state = STATES.IDLE;
  a.stateTime = 1.5;
  a.el.classList.remove('ecstasy');
  if (a._ecstasyHearts) {
    clearInterval(a._ecstasyHearts);
    a._ecstasyHearts = null;
  }
}

function showFloating(x, y, emoji) {
  const f = document.createElement('div');
  f.className = 'floating';
  f.textContent = emoji;
  f.style.left = (x - 14) + 'px';
  f.style.top = y + 'px';
  scene.appendChild(f);
  setTimeout(() => f.remove(), 1500);
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2000);
}

function dropFood() {
  if (animals.length === 0) {
    showToast('¡Activá alguna mascota primero! 🐾');
    return;
  }
  trackStat('fed');
  for (let i = 0; i < 3; i++) {
    const food = document.createElement('div');
    food.className = 'item bone-emoji';
    food.textContent = '🦴';
    const fx = Math.random() * (W - 80) + 40;
    const fy = Math.random() * (H - 280) + 160;
    food.style.left = fx + 'px';
    food.style.top = fy + 'px';
    scene.appendChild(food);
    foodItems.push({ el: food, x: fx + 19, y: fy + 19, eaten: false });
  }
  showToast('¡Hora de comer! 🦴');
  animals.forEach(a => {
    if (a.state === STATES.SLEEP) {
      setSprite(a, 'walk');
      hideZ(a);
      a.state = STATES.IDLE;
      a.stateTime = 0.3;
    }
  });
}

function throwToy() {
  if (animals.length === 0) {
    showToast('¡Activá alguna mascota primero! 🐾');
    return;
  }
  if (toys.length >= 2) {
    showToast('Esperá que terminen con esta 🔴');
    return;
  }
  trackStat('toys');
  const toy = document.createElement('div');
  toy.className = 'item ball';
  const tx = Math.random() * (W - 60) + 30;
  const ty = Math.random() * (H - 280) + 160;
  toy.style.left = tx + 'px';
  toy.style.top = ty + 'px';
  scene.appendChild(toy);
  const toyObj = {
    el: toy, x: tx + 16, y: ty + 16,
    vx: (Math.random() - 0.5) * 200,
    vy: (Math.random() - 0.5) * 100,
    rot: 0, life: 8,
    lastKickTime: 0, stillTime: 0,
  };
  toy.addEventListener('click', (e) => {
    e.stopPropagation();
    kickToy(toyObj);
  });
  toys.push(toyObj);
  showToast('¡A buscarla! 🔴');
  animals.forEach(a => {
    if (a.state === STATES.SLEEP && Math.random() < 0.5) {
      setSprite(a, 'walk');
      hideZ(a);
      a.state = STATES.IDLE;
      a.stateTime = 0.5;
    }
  });
}

function kickToy(t) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 250 + Math.random() * 150;
  t.vx = Math.cos(angle) * speed;
  t.vy = Math.sin(angle) * speed * 0.7;
  t.life = Math.min(t.life + 3, 12);
  t.stillTime = 0;
  showFloating(t.x, t.y - 10, '✨');
}

function updateToys(dt) {
  for (let i = toys.length - 1; i >= 0; i--) {
    const t = toys[i];
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    t.vx *= 0.96;
    t.vy *= 0.96;
    if (t.x < 20) { t.x = 20; t.vx = -t.vx * 0.7; }
    if (t.x > W - 30) { t.x = W - 30; t.vx = -t.vx * 0.7; }
    if (t.y < 110) { t.y = 110; t.vy = -t.vy * 0.7; }
    if (t.y > H - 120) { t.y = H - 120; t.vy = -t.vy * 0.7; }
    t.rot += t.vx * dt * 4;
    t.life -= dt;
    const speed = Math.sqrt(t.vx*t.vx + t.vy*t.vy);
    if (speed < 5) t.stillTime += dt;
    else t.stillTime = 0;
    t.el.style.left = (t.x - 16) + 'px';
    t.el.style.top = (t.y - 16) + 'px';
    t.el.style.transform = 'rotate(' + t.rot + 'deg)';
    if (t.life <= 0) {
      t.el.style.transition = 'transform 0.3s, opacity 0.3s';
      t.el.style.opacity = '0';
      const elToRemove = t.el;
      setTimeout(() => elToRemove.remove(), 300);
      toys.splice(i, 1);
    }
  }
}

function findNearestFood(a) {
  let nearest = null; let minD = Infinity;
  for (const f of foodItems) {
    if (f.eaten) continue;
    const dx = a.x - f.x;
    const dy = a.y - f.y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d < minD) { minD = d; nearest = f; }
  }
  return nearest;
}
function findFreeToy(a) {
  let best = null; let minD = Infinity;
  for (const t of toys) {
    const chasers = animals.filter(o => o !== a && o.state === STATES.PLAY && o.target === t).length;
    if (chasers >= 2) continue;
    const dx = a.x - t.x;
    const dy = a.y - t.y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d < minD) { minD = d; best = t; }
  }
  return best;
}

function pickNewState(a) {
  if (a._spectator) return;
  if (laser.active && (a.kind === 'cat' || a.kind === 'mouse') && Math.random() < 0.85) {
    a.state = STATES.CHASE_LASER;
    a.stateTime = 4 + Math.random() * 3;
    return;
  }
  const nearestFood = findNearestFood(a);
  if (nearestFood) {
    const dx = a.x - nearestFood.x;
    const dy = a.y - nearestFood.y;
    if (Math.sqrt(dx*dx + dy*dy) < 400) {
      a.state = STATES.EAT;
      a.target = nearestFood;
      a.stateTime = 12;
      return;
    }
  }
  const freeToy = findFreeToy(a);
  if (freeToy && Math.random() < 0.6) {
    const dx = a.x - freeToy.x;
    const dy = a.y - freeToy.y;
    if (Math.sqrt(dx*dx + dy*dy) < 400) {
      a.state = STATES.PLAY;
      a.target = freeToy;
      a.stateTime = 5 + Math.random() * 3;
      return;
    }
  }
  let sleepProb = 0.15;
  if (currentTime === 'NIGHT') sleepProb = 0.55;
  else if (currentTime === 'SUNSET') sleepProb = 0.25;
  if (currentWeather === 'STORM') sleepProb = 0.7;
  
  const r = Math.random();
  if (r < sleepProb) {
    a.state = STATES.SLEEP;
    a.stateTime = 5 + Math.random() * 8;
    a.vx = 0; a.vy = 0;
    a.target = null;
  } else if (r < sleepProb + 0.4) {
    a.state = STATES.WALK;
    a.stateTime = 3 + Math.random() * 5;
    const angle = Math.random() * Math.PI * 2;
    const speed = (30 + Math.random() * 30) * (a.speed || 1);
    a.vx = Math.cos(angle) * speed;
    a.vy = Math.sin(angle) * speed * 0.4;
    a.dir = a.vx >= 0 ? 1 : -1;
    a.target = null;
  } else if (r < sleepProb + 0.65) {
    a.state = STATES.IDLE;
    a.stateTime = 1 + Math.random() * 3;
    a.vx = 0; a.vy = 0;
    a.target = null;
  } else {
    const others = animals.filter(o => 
      o !== a && o.state !== STATES.SLEEP && o.state !== STATES.EAT && 
      o.state !== STATES.CHASE && o.state !== STATES.ECSTASY && o.w
    );
    if (others.length > 0) {
      const friend = others[Math.floor(Math.random() * others.length)];
      a.state = STATES.CHASE;
      a.target = friend;
      a.stateTime = 3 + Math.random() * 3;
    } else {
      a.state = STATES.IDLE;
      a.stateTime = 2;
      a.target = null;
    }
  }
}

function updateAnimal(a, dt) {
  if (!a.w) return;
  a.stateTime -= dt;
  a.bobOffset += dt * 8;
  
  if (a.state === STATES.SLEEP) {
    setSprite(a, 'sleep');
    if (!a.zEl) showZ(a);
    if (a.zEl) {
      a.zEl.style.left = (a.x + a.w * 0.65) + 'px';
      a.zEl.style.top = (a.y - 5) + 'px';
    }
  } else {
    setSprite(a, 'walk');
    hideZ(a);
  }

  if (a.state === STATES.WALK) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.x < 10) { a.x = 10; a.vx = Math.abs(a.vx); a.dir = 1; }
    if (a.x > W - a.w - 10) { a.x = W - a.w - 10; a.vx = -Math.abs(a.vx); a.dir = -1; }
    if (a.y < 110) { a.y = 110; a.vy = Math.abs(a.vy); }
    if (a.y > H - a.h - 110) { a.y = H - a.h - 110; a.vy = -Math.abs(a.vy); }
  } else if (a.state === STATES.CHASE) {
    if (a.target && a.target.el && a.target.x !== undefined && animals.includes(a.target)) {
      const dx = a.target.x - a.x;
      const dy = a.target.y - a.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      const MIN_DIST = 70;
      if (d > MIN_DIST) {
        const speed = 55 * (a.speed || 1);
        a.x += (dx / d) * speed * dt;
        a.y += (dy / d) * speed * dt;
        a.dir = dx >= 0 ? 1 : -1;
      } else {
        const perpX = -dy / (d || 1);
        const perpY = dx / (d || 1);
        a.x += perpX * 20 * dt;
        a.y += perpY * 20 * dt;
        if (Math.random() < 0.04) showFloating(a.x + a.w/2, a.y, '✨');
      }
    } else {
      a.target = null;
      a.state = STATES.IDLE;
      a.stateTime = 1;
    }
  } else if (a.state === STATES.EAT) {
    if (a.target && !a.target.eaten && foodItems.includes(a.target)) {
      const dx = a.target.x - (a.x + a.w/2);
      const dy = a.target.y - (a.y + a.h);
      const d = Math.sqrt(dx*dx + dy*dy) || 1;
      if (d > 25) {
        const speed = 80;
        a.x += (dx / d) * speed * dt;
        a.y += (dy / d) * speed * dt;
        a.dir = dx >= 0 ? 1 : -1;
      } else {
        a.target.eaten = true;
        const eatenEl = a.target.el;
        if (eatenEl) {
          eatenEl.style.transition = 'transform 0.3s, opacity 0.3s';
          eatenEl.style.transform = 'scale(0)';
          eatenEl.style.opacity = '0';
          setTimeout(() => eatenEl.remove(), 400);
        }
        foodItems = foodItems.filter(f => !f.eaten);
        showFloating(a.x + a.w/2, a.y, '😋');
        a.state = STATES.IDLE;
        a.stateTime = 1.5;
        a.target = null;
      }
    } else {
      a.state = STATES.IDLE;
      a.stateTime = 1;
      a.target = null;
    }
  } else if (a.state === STATES.PLAY) {
    if (a.target && toys.includes(a.target)) {
      const dx = a.target.x - (a.x + a.w/2);
      const dy = a.target.y - (a.y + a.h/2);
      const d = Math.sqrt(dx*dx + dy*dy) || 1;
      if (d > 35) {
        const speed = 90;
        a.x += (dx / d) * speed * dt;
        a.y += (dy / d) * speed * dt;
        a.dir = dx >= 0 ? 1 : -1;
      } else {
        const now = performance.now();
        if (now - a.target.lastKickTime > 500) {
          const otherChasers = animals.filter(o => 
            o !== a && o.state === STATES.PLAY && o.target === a.target
          );
          let kickAngle;
          if (otherChasers.length > 0) {
            let avgX = 0, avgY = 0;
            for (const o of otherChasers) {
              avgX += o.x; avgY += o.y;
            }
            avgX /= otherChasers.length;
            avgY /= otherChasers.length;
            const awayX = a.target.x - avgX;
            const awayY = a.target.y - avgY;
            kickAngle = Math.atan2(awayY, awayX) + (Math.random() - 0.5) * 0.6;
          } else {
            kickAngle = Math.random() * Math.PI * 2;
          }
          const kickSpeed = 200 + Math.random() * 100;
          a.target.vx = Math.cos(kickAngle) * kickSpeed;
          a.target.vy = Math.sin(kickAngle) * kickSpeed * 0.7;
          a.target.lastKickTime = now;
          a.target.life = Math.min(a.target.life + 2, 12);
          a.target.stillTime = 0;
          if (Math.random() < 0.5) showFloating(a.x + a.w/2, a.y, '🎾');
        }
        if (a.target.stillTime > 1) kickToy(a.target);
      }
    } else {
      a.state = STATES.IDLE;
      a.stateTime = 1;
      a.target = null;
    }
  } else if (a.state === STATES.CHASE_LASER) {
    if (laser.active) {
      const dx = laser.x - (a.x + a.w/2);
      const dy = laser.y - (a.y + a.h/2);
      const d = Math.sqrt(dx*dx + dy*dy) || 1;
      const speed = 130 * (a.speed || 1);
      a.x += (dx / d) * speed * dt;
      a.y += (dy / d) * speed * dt;
      a.dir = dx >= 0 ? 1 : -1;
      if (a.x < 10) a.x = 10;
      if (a.x > W - a.w - 10) a.x = W - a.w - 10;
      if (a.y < 110) a.y = 110;
      if (a.y > H - a.h - 110) a.y = H - a.h - 110;
      if (Math.random() < 0.02) showFloating(a.x + a.w/2, a.y, '✨');
    } else {
      a.state = STATES.IDLE;
      a.stateTime = 1;
    }
  }

  // Colisión con la laguna: los animales que no están pescando no pueden entrar
  if (a.state !== STATES.FISH && typeof fishingState !== 'undefined' && fishingState && fishingState.pondBounds) {
    const pb = fishingState.pondBounds;
    const cx = a.x + a.w / 2;
    const cy = a.y + a.h * 0.75;
    const ex = pb.x + pb.w / 2;
    const ey = pb.y + pb.h / 2;
    const nx = (cx - ex) / (pb.w / 2);
    const ny = (cy - ey) / (pb.h / 2);
    if (nx * nx + ny * ny < 1) {
      const len = Math.sqrt(nx * nx + ny * ny) || 0.01;
      a.x = ex + (nx / len) * (pb.w / 2) - a.w / 2;
      a.y = ey + (ny / len) * (pb.h / 2) - a.h * 0.75;
      a.vx = -a.vx * 0.5;
      a.vy = -a.vy * 0.5;
    }
  }

  if (a.stateTime <= 0 && a.state !== STATES.ECSTASY && a.state !== STATES.RACE && a.state !== STATES.FETCH_GO && a.state !== STATES.FETCH_RETURN && a.state !== STATES.FISH && a.state !== STATES.SNIFF) {
    pickNewState(a);
  }

  let bobY = 0;
  if ([STATES.WALK, STATES.CHASE, STATES.EAT, STATES.PLAY, STATES.CHASE_LASER, STATES.RACE, STATES.FETCH_GO, STATES.FETCH_RETURN, STATES.SNIFF].includes(a.state)) {
    bobY = Math.sin(a.bobOffset) * 2;
  }

  if (a.baseW) {
    const ps = perspectiveScale(a.y);
    a.w = a.baseW * ps;
    a.h = a.baseH * ps;
    a.el.style.width = a.w + 'px';
    a.el.style.height = a.h + 'px';
  }

  a.el.style.left = a.x + 'px';
  a.el.style.top = (a.y + bobY) + 'px';

  if (a.state !== STATES.SLEEP && a.state !== STATES.ECSTASY) {
    a.el.style.transform = 'scaleX(' + a.dir + ')';
  } else if (a.state === STATES.ECSTASY) {
    a.el.style.setProperty('--dir', a.dir);
  } else {
    a.el.style.transform = '';
  }
  a.el.style.zIndex = Math.floor(a.y);

  if (a.shadowEl) {
    const sw = (a.w || 60) * 0.7;
    const sh = sw * 0.28;
    a.shadowEl.style.left = (a.x + (a.w || 60) / 2 - sw / 2) + 'px';
    a.shadowEl.style.top = (a.y + (a.h || 60) - sh * 0.5) + 'px';
    a.shadowEl.style.width = sw + 'px';
    a.shadowEl.style.height = sh + 'px';
    a.shadowEl.style.zIndex = Math.floor(a.y) - 1;
    const psFactor = a.baseW ? perspectiveScale(a.y) : 1;
    a.shadowEl.style.opacity = 0.18 + psFactor * 0.22;
  }
}

function loop(t) {
  if (!lastTime) lastTime = t;
  const dt = Math.min(0.05, (t - lastTime) / 1000);
  lastTime = t;

  updateTimeOfDay();
  maybeChangeWeather();
  drawBackground();
  drawWeather(dt);
  if (typeof fishingState !== 'undefined' && fishingState) drawFishingRod();
  
  updateToys(dt);
  
  if (raceState && raceState.running) updateRace(dt);
  if (currentGame === 'fetch') updateFetch(dt);
  if (currentGame === 'hidebone') updateHidebone(dt);
  
  for (const a of animals) {
    try { updateAnimal(a, dt); } catch(err) {
      console.warn('Error animando', a.name, err);
      a.state = STATES.IDLE;
      a.stateTime = 1;
      a.target = null;
    }
  }
  
  let status = '';
  if (animals.length === 0) {
    status = '🐾 Sin mascotas';
  } else {
    const sleepingCount = animals.filter(a => a.state === STATES.SLEEP).length;
    const eatingCount = animals.filter(a => a.state === STATES.EAT).length;
    const playingCount = animals.filter(a => a.state === STATES.PLAY).length;
    const laserCount = animals.filter(a => a.state === STATES.CHASE_LASER).length;
    if (laserCount > 0) status = '🔴 ' + laserCount + ' cazando';
    else if (eatingCount > 0) status = '🦴 ' + eatingCount + ' comiendo';
    else if (playingCount > 0) status = '🎾 ' + playingCount + ' jugando';
    else if (sleepingCount > Math.floor(animals.length/2)) status = '💤 La mayoría duerme';
    else status = '🌷 ' + animals.length + (animals.length === 1 ? ' amiguito' : ' amiguitos');
  }
  document.getElementById('count').textContent = status;

  requestAnimationFrame(loop);
}

