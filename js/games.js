// ============ MINIJUEGOS ============

let currentGame = null;
const laser = { active: false, x: 0, y: 0, el: null };

function showGameBanner(text) {
  const b = document.getElementById('gameBanner');
  document.getElementById('gameBannerText').textContent = text;
  b.classList.add('show');
}
function hideGameBanner() {
  document.getElementById('gameBanner').classList.remove('show');
}
function endCurrentGame() {
  if (currentGame === 'laser') stopLaser();
  else if (currentGame === 'ecstasy') stopRascarMode();
  else if (currentGame === 'race') endRace(true);
  else if (currentGame === 'fetch') stopFetch();
  else if (currentGame === 'fishing') stopFishing();
  else if (currentGame === 'hidebone') stopHidebone();
  currentGame = null;
  hideGameBanner();
}

function startLaser() {
  closeGames();
  if (currentGame) endCurrentGame();
  currentGame = 'laser';
  const cats = animals.filter(a => a.kind === 'cat' || a.kind === 'mouse');
  if (cats.length === 0) {
    showToast('¡Activá algún gato o la rata primero! 🐱');
    currentGame = null;
    return;
  }
  trackStat('laserSessions');
  showGameBanner('🔴 Movés el dedo y los gatos persiguen el láser');
  laser.active = true;
  laser.x = W / 2;
  laser.y = H / 2;
  if (!laser.el) {
    laser.el = document.createElement('div');
    laser.el.className = 'laser-dot active';
    scene.appendChild(laser.el);
  }
  updateLaserPos();
  scene.addEventListener('pointerdown', laserPointerHandler);
  scene.addEventListener('pointermove', laserPointerHandler);
}
function laserPointerHandler(e) {
  if (!laser.active) return;
  laser.x = e.clientX;
  laser.y = e.clientY;
  updateLaserPos();
}
function updateLaserPos() {
  if (!laser.el) return;
  laser.el.style.left = laser.x + 'px';
  laser.el.style.top = laser.y + 'px';
}
function stopLaser() {
  laser.active = false;
  if (laser.el) { laser.el.remove(); laser.el = null; }
  scene.removeEventListener('pointerdown', laserPointerHandler);
  scene.removeEventListener('pointermove', laserPointerHandler);
  animals.forEach(a => {
    if (a.state === STATES.CHASE_LASER) {
      a.state = STATES.IDLE;
      a.stateTime = 1;
    }
  });
}

function startRascar() {
  closeGames();
  if (currentGame) endCurrentGame();
  currentGame = 'ecstasy';
  showGameBanner('🤲 Mantené apretado a un animalito');
  showToast('Mantené el dedo apretado sobre cualquier animalito');
}
function stopRascarMode() {
  animals.forEach(a => {
    if (a.state === STATES.ECSTASY) stopEcstasy(a);
  });
}

let raceState = null;
let raceSelectedKeys = new Set();

function startRace() {
  closeGames();
  if (currentGame) endCurrentGame();
  if (animals.length < 2) {
    showToast('Necesitás al menos 2 mascotas activas 🐾');
    return;
  }
  raceSelectedKeys = new Set();
  const list = document.getElementById('raceSelectList');
  list.innerHTML = '';
  animals.forEach(a => {
    const card = document.createElement('div');
    card.className = 'animal-card';
    card.innerHTML = '<div class="check">✓</div><img src="' + a.src + '" alt="' + a.name + '"><div class="name">' + a.name + '</div>';
    card.addEventListener('click', () => {
      if (raceSelectedKeys.has(a.key)) {
        raceSelectedKeys.delete(a.key);
        card.classList.remove('active');
      } else if (raceSelectedKeys.size < 4) {
        raceSelectedKeys.add(a.key);
        card.classList.add('active');
      } else {
        showToast('Máximo 4 corredores 🏁');
      }
      updateRaceSelectBtn();
    });
    list.appendChild(card);
  });
  updateRaceSelectBtn();
  document.getElementById('raceSelectBg').classList.add('show');
}

function updateRaceSelectBtn() {
  const btn = document.getElementById('raceSelectBtn');
  const n = raceSelectedKeys.size;
  btn.disabled = n < 2;
  btn.style.opacity = n < 2 ? '0.5' : '1';
  btn.textContent = n < 2 ? 'Elegí ' + (2 - n) + ' más' : '¡A correr! (' + n + ')';
}

function closeRaceSelect(cancelled) {
  document.getElementById('raceSelectBg').classList.remove('show');
  if (cancelled) raceSelectedKeys = new Set();
}

function confirmRaceSelection() {
  if (raceSelectedKeys.size < 2) return;
  closeRaceSelect(false);
  const racers = animals.filter(a => raceSelectedKeys.has(a.key));
  raceState = { racers, betKey: null };
  const list = document.getElementById('raceBetList');
  list.innerHTML = '';
  racers.forEach(a => {
    const card = document.createElement('div');
    card.className = 'animal-card active';
    card.innerHTML = '<img src="' + a.src + '" alt="' + a.name + '"><div class="name">' + a.name + '</div>';
    card.addEventListener('click', () => {
      raceState.betKey = a.key;
      closeRaceBet(false);
      runRace();
    });
    list.appendChild(card);
  });
  const noBet = document.createElement('div');
  noBet.className = 'animal-card';
  noBet.style.cssText = 'grid-column:1/-1;justify-content:center;opacity:0.75;';
  noBet.innerHTML = '<div style="font-size:22px">🎲</div><div class="name">Sin apuesta</div>';
  noBet.addEventListener('click', () => { closeRaceBet(false); runRace(); });
  list.appendChild(noBet);
  document.getElementById('raceBetBg').classList.add('show');
}
function closeRaceBet(cancelled) {
  document.getElementById('raceBetBg').classList.remove('show');
  // Solo limpiar si el usuario canceló (no si eligió mascota y va a runRace)
  if (cancelled && raceState && !raceState.running) raceState = null;
}
function runRace() {
  currentGame = 'race';
  showGameBanner('🏁 ¡Carrera!');
  const racers = raceState.racers;
  const startX = 30;
  const finishX = W - 50;
  const trackTop = H * 0.38;
  const trackHeight = H * 0.42;
  const lanes = racers.length;
  const laneHeight = trackHeight / lanes;
  racers.forEach((a, i) => {
    a.state = STATES.RACE;
    a.stateTime = 999;
    a.x = startX;
    // Si el animal no tiene tamaño todavía, usar un default razonable
    const h = a.h || Math.min(W, H) * 0.20 * a.scale;
    const w = a.w || h;
    if (!a.w) { a.w = w; a.h = h; a.el.style.width = w + 'px'; a.el.style.height = h + 'px'; }
    a.y = trackTop + i * laneHeight + (laneHeight - a.h) / 2;
    a.dir = 1;
    a.raceFinished = false;
    a.raceTime = 0;
    a.raceSpeedBase = 100 + Math.random() * 30;
    a.raceCurrentSpeed = a.raceSpeedBase;
    a.raceSpeedTarget = a.raceSpeedBase;
  });
  // Espectadores: se acomodan en fila arriba y alientan
  const spectators = animals.filter(a => !racers.includes(a));
  const spacing = W / Math.max(spectators.length + 1, 2);
  spectators.forEach((a, i) => {
    if (a._ecstasyHearts) { clearInterval(a._ecstasyHearts); a._ecstasyHearts = null; }
    a.state = STATES.IDLE;
    a.stateTime = 9999;
    a.x = spacing * (i + 1) - (a.w || 60) / 2;
    a.y = 125;
    a.vx = 0; a.vy = 0;
    a.target = null;
    a._spectator = true;
  });
  raceState.spectators = spectators;

  const cheerEmojis = ['🎉', '👏', '🥳', '⚡', '💪', '🏁', '🎊', '🙌'];
  raceState.cheerInterval = setInterval(() => {
    if (!raceState || !raceState.running || !raceState.go) return;
    raceState.spectators.forEach(a => {
      if (Math.random() < 0.55) {
        showFloating(a.x + (a.w || 60) / 2, a.y,
          cheerEmojis[Math.floor(Math.random() * cheerEmojis.length)]);
      }
    });
  }, 1300);

  document.getElementById('raceTrack').style.display = 'block';
  const track = document.getElementById('raceTrack');
  track.style.top = (trackTop) + 'px';
  track.style.height = (trackHeight + (racers[racers.length-1].h || 80)) + 'px';
  raceState.running = true;
  raceState.startX = startX;
  raceState.finishX = finishX;
  raceState.startTime = performance.now();
  raceState.finishOrder = [];
  
  const hud = document.getElementById('raceHud');
  hud.classList.add('show');
  hud.innerHTML = '<h3>¡Preparados!</h3><div class="count-num">3</div>';
  setTimeout(() => { if (raceState && raceState.running) hud.innerHTML = '<h3>¡Listos!</h3><div class="count-num">2</div>'; }, 800);
  setTimeout(() => { if (raceState && raceState.running) hud.innerHTML = '<h3>¡Ya!</h3><div class="count-num">1</div>'; }, 1600);
  setTimeout(() => {
    if (raceState && raceState.running) {
      hud.classList.remove('show');
      raceState.go = true;
    }
  }, 2400);
}

function updateRace(dt) {
  if (!raceState || !raceState.running) return;
  if (!raceState.go) return;
  const racers = raceState.racers;
  for (const a of racers) {
    if (a.raceFinished) continue;
    a.raceTime += dt;
    if (Math.random() < dt * 0.8) {
      a.raceSpeedTarget = a.raceSpeedBase * (0.7 + Math.random() * 0.7);
    }
    a.raceCurrentSpeed += (a.raceSpeedTarget - a.raceCurrentSpeed) * dt * 3;
    a.x += a.raceCurrentSpeed * (a.speed || 1) * dt;
    a.bobOffset += dt * 12;
    if (a.x >= raceState.finishX) {
      a.x = raceState.finishX;
      a.raceFinished = true;
      raceState.finishOrder.push(a);
      const medals = ['🥇', '🥈', '🥉'];
      showFloating(a.x, a.y, medals[raceState.finishOrder.length - 1] || '🎉');
    }
  }
  const allDone = racers.every(a => a.raceFinished);
  if (allDone) finishRace();
}

function finishRace() {
  raceState.running = false;
  raceState.go = false;
  const winner = raceState.finishOrder[0];
  if (!winner) return;
  const userBetKey = raceState.betKey;
  const userWon = userBetKey === winner.key;
  trackStat('races');
  if (userWon) trackStat('racesWon');
  const hud = document.getElementById('raceHud');
  hud.classList.add('show');
  let html = '<h3>¡Ganó ' + winner.name + '! 🏆</h3>';
  html += '<div style="margin: 12px 0; font-size:14px;">';
  raceState.finishOrder.forEach((a, i) => {
    const medals = ['🥇','🥈','🥉','4️⃣'];
    html += '<div style="margin: 4px 0;">' + (medals[i] || (i+1)+'°') + ' ' + a.name + '</div>';
  });
  html += '</div>';
  if (userBetKey) {
    if (userWon) html += '<div class="winner">¡Acertaste! 🎉</div>';
    else { const b = ANIMAL_DATA.find(a => a.key === userBetKey); html += '<div style="opacity:0.8;">Apostaste por ' + (b ? b.name : userBetKey) + '</div>'; }
  }
  html += '<button onclick="endRace(false)" style="margin-top:14px; background:#66bb6a; border:none; color:white; padding:10px 20px; border-radius:10px; font-size:14px;">Cerrar</button>';
  hud.innerHTML = html;
}

function endRace(forced) {
  document.getElementById('raceHud').classList.remove('show');
  document.getElementById('raceTrack').style.display = 'none';
  if (raceState) {
    if (raceState.cheerInterval) clearInterval(raceState.cheerInterval);
    if (raceState.spectators) {
      raceState.spectators.forEach(a => { a._spectator = false; a.stateTime = 0; });
    }
    raceState.racers.forEach(a => { a.state = STATES.IDLE; a.stateTime = 1; });
  }
  animals.forEach(a => {
    if (a.state === STATES.IDLE && a.stateTime > 100) a.stateTime = 1;
  });
  raceState = null;
  currentGame = null;
  hideGameBanner();
}


// ─── FETCH ───
let fetchState = null;

function startFetch() {
  closeGames();
  if (currentGame) endCurrentGame();
  const dogs = animals.filter(a => a.kind === 'dog');
  if (dogs.length === 0) {
    showToast('¡Necesitás al menos un perro activo! 🐕');
    return;
  }
  currentGame = 'fetch';
  fetchState = { phase: 'throw', boneEl: null, boneX: 0, boneY: 0, fetcher: null, mouthBone: null };
  showGameBanner('🦴 Tocá en cualquier lugar para tirar el hueso');
  showToast('Tocá para tirar el hueso');
  scene.addEventListener('pointerdown', fetchThrowHandler);
}

function fetchThrowHandler(e) {
  if (!fetchState || fetchState.phase !== 'throw') return;
  // Ignorar toques en botones
  if (e.target.closest('.controls, .game-banner, .icon-btn')) return;
  e.stopPropagation();

  const x = e.clientX;
  const y = e.clientY;

  // Mostrar indicador de aterrizaje
  const indicator = document.createElement('div');
  indicator.className = 'throw-indicator';
  indicator.style.left = x + 'px';
  indicator.style.top = y + 'px';
  scene.appendChild(indicator);

  // Crear hueso en el destino
  const boneEl = document.createElement('div');
  boneEl.className = 'fetch-bone';
  boneEl.textContent = '🦴';
  boneEl.style.left = (x - 16) + 'px';
  boneEl.style.top = (y - 16) + 'px';
  scene.appendChild(boneEl);

  fetchState.boneEl = boneEl;
  fetchState.boneX = x;
  fetchState.boneY = y;
  fetchState.phase = 'go';

  setTimeout(() => indicator.remove(), 800);
  scene.removeEventListener('pointerdown', fetchThrowHandler);
  showGameBanner('🦴 ¡A buscarlo!');
  showToast('¡Van a buscarlo! 🐕');

  // Elegir los perros disponibles (máx 2 compiten)
  const dogs = animals.filter(a => a.kind === 'dog' && a.state !== STATES.SLEEP);
  const competitors = dogs.slice(0, Math.min(2, dogs.length));
  competitors.forEach(dog => {
    dog.state = STATES.FETCH_GO;
    dog.stateTime = 20;
    dog.fetchTargetX = x;
    dog.fetchTargetY = y;
    dog.dir = x > dog.x ? 1 : -1;
  });
  fetchState.competitors = competitors;
  fetchState.fetcher = null;
}

function updateFetch(dt) {
  if (!fetchState) return;
  if (fetchState.phase !== 'go' && fetchState.phase !== 'return') return;

  const { competitors, boneX, boneY } = fetchState;

  if (fetchState.phase === 'go') {
    // Mover cada perro hacia el hueso y verificar si llegó
    for (const dog of competitors) {
      if (dog.state !== STATES.FETCH_GO) continue;
      const dx = boneX - (dog.x + dog.w / 2);
      const dy = boneY - (dog.y + dog.h / 2);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 35) {
        const speed = 120 * (dog.speed || 1);
        dog.x += (dx / d) * speed * dt;
        dog.y += (dy / d) * speed * dt;
        dog.dir = dx >= 0 ? 1 : -1;
        dog.bobOffset += dt * 10;
      }
      if (d < 40) {
        // Este perro agarró el hueso
        fetchState.fetcher = dog;
        fetchState.phase = 'return';
        // Quitar hueso del suelo
        if (fetchState.boneEl) { fetchState.boneEl.remove(); fetchState.boneEl = null; }
        // Poner hueso en la boca (emoji flotando sobre el hocico)
        const mb = document.createElement('div');
        mb.className = 'fetch-bone in-mouth';
        mb.textContent = '🦴';
        mb.style.zIndex = 25;
        scene.appendChild(mb);
        fetchState.mouthBone = mb;
        showFloating(dog.x + dog.w / 2, dog.y, '😁');
        showGameBanner('🦴 ¡Lo tiene! Espera que lo traiga...');
        // Los otros perros vuelven a idle
        competitors.filter(d => d !== dog).forEach(d => {
          d.state = STATES.IDLE;
          d.stateTime = 2;
        });
        break;
      }
    }
  }

  if (fetchState.phase === 'return' && fetchState.fetcher) {
    const dog = fetchState.fetcher;
    // El hueso sigue al hocico del perro
    if (fetchState.mouthBone) {
      const boneOffX = dog.dir === 1 ? dog.w * 0.65 : -4;
      fetchState.mouthBone.style.left = (dog.x + boneOffX) + 'px';
      fetchState.mouthBone.style.top = (dog.y + dog.h * 0.35) + 'px';
    }

    // Moverse hacia el centro inferior (donde está el usuario)
    const targetX = W / 2;
    const targetY = H - 200;
    const dx = targetX - (dog.x + dog.w / 2);
    const dy = targetY - (dog.y + dog.h / 2);
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 50) {
      const speed = 110 * (dog.speed || 1);
      dog.x += (dx / d) * speed * dt;
      dog.y += (dy / d) * speed * dt;
      dog.dir = dx >= 0 ? 1 : -1;
      dog.state = STATES.FETCH_RETURN;
    } else {
      // ¡Llegó! Entregó el hueso
      if (fetchState.mouthBone) { fetchState.mouthBone.remove(); fetchState.mouthBone = null; }
      showFloating(dog.x + dog.w / 2, dog.y, '🎉');
      showToast('¡' + dog.name + ' trajo el hueso! 🦴 Tocá para tirarlo de nuevo');
      trackStat('bonesFetched');
      dog.state = STATES.IDLE;
      dog.stateTime = 1;
      fetchState.phase = 'throw';
      showGameBanner('🦴 Tocá para tirar el hueso de nuevo');
      scene.removeEventListener('pointerdown', fetchThrowHandler);
      scene.addEventListener('pointerdown', fetchThrowHandler);
    }
  }
}

function stopFetch() {
  if (fetchState) {
    if (fetchState.boneEl) fetchState.boneEl.remove();
    if (fetchState.mouthBone) fetchState.mouthBone.remove();
    if (fetchState.competitors) {
      fetchState.competitors.forEach(d => { d.state = STATES.IDLE; d.stateTime = 1; });
    }
  }
  scene.removeEventListener('pointerdown', fetchThrowHandler);
  fetchState = null;
}

// ============================================
// MINIJUEGO: PESCA
// ============================================
let fishingState = null;

function startFishing() {
  closeGames();
  if (currentGame) endCurrentGame();
  // Mostrar selector de pescador
  const eligible = animals.filter(a => a.kind === 'cat' || a.kind === 'mouse');
  if (eligible.length === 0) {
    showToast('¡Necesitás un gato o a Roedor! 🐱');
    return;
  }
  const list = document.getElementById('fisherList');
  list.innerHTML = '';
  eligible.forEach(a => {
    const card = document.createElement('div');
    card.className = 'animal-card active';
    card.innerHTML = `<img src="${a.src}" alt="${a.name}" style="width:56px;height:56px;object-fit:contain;image-rendering:pixelated;">
      <div class="name" style="font-size:10px;color:#5d4037;font-weight:600;">${a.name}</div>`;
    card.addEventListener('click', () => {
      closeFisherModal(false);
      runFishing(a);
    });
    list.appendChild(card);
  });
  document.getElementById('fisherBg').classList.add('show');
}

function closeFisherModal(cancelled) {
  document.getElementById('fisherBg').classList.remove('show');
  if (cancelled) currentGame = null;
}

document.getElementById('fisherBg').addEventListener('click', e => {
  if (e.target.id === 'fisherBg') closeFisherModal(true);
});

function runFishing(fisher) {
  currentGame = 'fishing';
  showGameBanner('🎣 Tocá cuando el pez muerda el anzuelo');

  // Crear el estanque (óvalo azul en el centro)
  const pondW = Math.min(W * 0.6, 260);
  const pondH = pondW * 0.55;
  const pondX = (W - pondW) / 2;
  const pondY = H * 0.38;

  const pondEl = document.createElement('div');
  pondEl.className = 'pond';
  pondEl.id = 'fishPond';
  pondEl.style.left = pondX + 'px';
  pondEl.style.top = pondY + 'px';
  pondEl.style.width = pondW + 'px';
  pondEl.style.height = pondH + 'px';
  pondEl.innerHTML =
    '<div class="pond-shine"></div>' +
    '<div class="pond-ripple" style="animation-delay:0s"></div>' +
    '<div class="pond-ripple" style="animation-delay:0.9s;width:58%;height:58%;left:21%;top:21%"></div>' +
    '<div class="pond-ripple" style="animation-delay:1.8s;width:78%;height:78%;left:11%;top:11%"></div>' +
    '<span class="pond-lily" style="left:10%;top:20%;animation-delay:0s">🪷</span>' +
    '<span class="pond-lily" style="left:66%;top:55%;animation-delay:1.3s">🍃</span>';
  scene.appendChild(pondEl);

  // Posicionar al pescador al borde del estanque
  fisher.state = STATES.FISH;
  fisher.stateTime = 999;
  fisher.x = pondX - fisher.w * 0.3;
  fisher.y = pondY + pondH * 0.3;
  fisher.dir = 1;

  // Línea de pesca (div posicionado)
  const lineEl = document.createElement('div');
  lineEl.id = 'fishingLine';
  lineEl.style.cssText = 'position:absolute;z-index:22;pointer-events:none;';
  scene.appendChild(lineEl);

  // Canvas propio para la caña (z-index alto, encima de todo)
  const rodCanvas = document.createElement('canvas');
  rodCanvas.width = W;
  rodCanvas.height = H;
  rodCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:900;';
  scene.appendChild(rodCanvas);
  const rctx = rodCanvas.getContext('2d');

  fishingState = {
    fisher, pondEl, lineEl, rodCanvas, rctx,
    pondX, pondY, pondW, pondH,
    pondBounds: { x: pondX, y: pondY, w: pondW, h: pondH },
    phase: 'idle', // idle → casting → waiting → bite → caught/missed
    castTimer: 0,
    waitTimer: 0,
    biteTimer: 0,
    biteWindow: 0,
    fishEl: null,
    biteEl: null,
    score: 0,
    castTimeout: null,
  };

  // Empezar ciclo de pesca después de un momento
  fishingState.castTimeout = setTimeout(() => doCast(), 1500);
  showToast(fisher.name + ' se sienta a pescar 🎣');
}

function doCast() {
  if (!fishingState) return;
  fishingState.phase = 'waiting';
  // Tiempo aleatorio hasta que el pez pique (3-8s)
  const wait = 3000 + Math.random() * 5000;
  fishingState.castTimeout = setTimeout(() => doBite(), wait);
}

function doBite() {
  if (!fishingState) return;
  fishingState.phase = 'bite';
  // Mostrar indicador de picada
  const { pondX, pondY, pondW, pondH } = fishingState;
  const bx = pondX + pondW * 0.4 + Math.random() * pondW * 0.2;
  const by = pondY + pondH * 0.3 + Math.random() * pondH * 0.3;
  const biteEl = document.createElement('div');
  biteEl.className = 'bite-indicator';
  biteEl.style.left = bx + 'px';
  biteEl.style.top = by + 'px';
  biteEl.style.opacity = '0'; // la caña dibuja el indicador en canvas
  scene.appendChild(biteEl);
  fishingState.biteEl = biteEl;
  // Ventana de 1.5s para tocar
  fishingState.biteTimeout = setTimeout(() => missedFish(), 1500);
  // Listener de toque
  scene.addEventListener('pointerdown', catchFishHandler);
}

function catchFishHandler(e) {
  if (!fishingState || fishingState.phase !== 'bite') return;
  if (e.target.closest('.controls, .game-banner')) return;
  e.stopPropagation();
  clearTimeout(fishingState.biteTimeout);
  scene.removeEventListener('pointerdown', catchFishHandler);
  caughtFish();
}



function caughtFish() {
  if (!fishingState) return;
  if (fishingState.biteEl) { fishingState.biteEl.remove(); fishingState.biteEl = null; }
  fishingState.phase = 'caught';
  fishingState.score++;
  trackStat('fishCaught');
  const fish = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
  // Pez flotando hacia arriba
  const { pondX, pondY, pondW } = fishingState;
  const fishEl = document.createElement('div');
  fishEl.className = 'floating';
  fishEl.textContent = fish;
  fishEl.style.fontSize = '32px';
  fishEl.style.left = (pondX + pondW / 2) + 'px';
  fishEl.style.top = pondY + 'px';
  scene.appendChild(fishEl);
  setTimeout(() => fishEl.remove(), 1500);
  showFloating(fishingState.fisher.x + fishingState.fisher.w / 2, fishingState.fisher.y, '🎉');
  showToast('¡' + fishingState.fisher.name + ' atrapó un ' + fish + '! Total: ' + fishingState.score);
  // Próxima tirada
  fishingState.castTimeout = setTimeout(() => doCast(), 2000);
}

function missedFish() {
  if (!fishingState) return;
  if (fishingState.biteEl) { fishingState.biteEl.remove(); fishingState.biteEl = null; }
  scene.removeEventListener('pointerdown', catchFishHandler);
  fishingState.phase = 'idle';
  showToast('¡Se escapó! 😢');
  showFloating(fishingState.fisher.x + fishingState.fisher.w / 2, fishingState.fisher.y, '💨');
  fishingState.castTimeout = setTimeout(() => doCast(), 1500);
}

function stopFishing() {
  if (!fishingState) return;
  clearTimeout(fishingState.castTimeout);
  clearTimeout(fishingState.biteTimeout);
  scene.removeEventListener('pointerdown', catchFishHandler);
  if (fishingState.biteEl) fishingState.biteEl.remove();
  if (fishingState.pondEl) fishingState.pondEl.remove();
  if (fishingState.lineEl) fishingState.lineEl.remove();
  if (fishingState.rodCanvas) fishingState.rodCanvas.remove();
  if (fishingState.fisher) {
    fishingState.fisher.state = STATES.IDLE;
    fishingState.fisher.stateTime = 1;
  }
  const score = fishingState.score;
  fishingState = null;
  if (score > 0) showToast('Sesión terminada. Total: ' + score + ' peces 🐟');
}

// ============================================
// MINIJUEGO: ESCONDER EL HUESO
// ============================================
let hideboneState = null;

function startHidebone() {
  closeGames();
  if (currentGame) endCurrentGame();
  const dogs = animals.filter(a => a.kind === 'dog');
  if (dogs.length === 0) {
    showToast('¡Necesitás al menos un perro! 🐕');
    return;
  }
  currentGame = 'hidebone';

  // Instrucción
  const instr = document.createElement('div');
  instr.className = 'hide-instruction';
  instr.id = 'hideboneInstr';
  instr.textContent = '🦴 Tocá y arrastrá el hueso a donde quieras esconderlo';
  document.body.appendChild(instr);
  setTimeout(() => { if (instr.parentNode) instr.remove(); }, 2500);

  // Crear hueso arrastrable en el centro
  const dragBone = document.createElement('div');
  dragBone.className = 'hide-bone-drag';
  dragBone.textContent = '🦴';
  dragBone.style.left = (W / 2) + 'px';
  dragBone.style.top = (H / 2) + 'px';
  document.body.appendChild(dragBone);

  hideboneState = {
    dragBone, dogs,
    boneX: W / 2, boneY: H / 2,
    hidden: false,
    foundBy: null,
    sniffEls: [],
  };

  // Drag del hueso
  let dragging = false;
  const onDown = (e) => {
    dragging = true;
    dragBone.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  };
  const onMove = (e) => {
    if (!dragging || !hideboneState || hideboneState.hidden) return;
    dragBone.style.left = e.clientX + 'px';
    dragBone.style.top = e.clientY + 'px';
    hideboneState.boneX = e.clientX;
    hideboneState.boneY = e.clientY;
  };
  const onUp = (e) => {
    if (!dragging || !hideboneState || hideboneState.hidden) return;
    dragging = false;
    hideBoneNow();
  };

  dragBone.addEventListener('pointerdown', onDown);
  dragBone.addEventListener('pointermove', onMove);
  dragBone.addEventListener('pointerup', onUp);
  hideboneState._dragBone = dragBone;
  hideboneState._onDown = onDown;
  hideboneState._onMove = onMove;
  hideboneState._onUp = onUp;

  showGameBanner('🦴 Arrastrá el hueso para esconderlo');
}

function hideBoneNow() {
  if (!hideboneState || hideboneState.hidden) return;
  hideboneState.hidden = true;
  trackStat('bonesHidden');
  const { boneX, boneY, dragBone, dogs } = hideboneState;
  // Remover listeners
  document.removeEventListener('pointermove', hideboneState._onMove);
  document.removeEventListener('pointerup', hideboneState._onUp);
  // Animación de enterrar
  dragBone.style.transition = 'transform 0.5s, opacity 0.5s';
  dragBone.style.transform = 'translate(-50%,-50%) scale(0)';
  dragBone.style.opacity = '0';
  setTimeout(() => { if (dragBone.parentNode) dragBone.remove(); }, 500);

  showGameBanner('🐽 ¡Los perros están buscando el hueso!');
  showToast('¡Escondido! Los perros lo buscan...');

  // Calcular tiempo de búsqueda según distancia promedio
  const avgDist = dogs.length > 0 ? dogs.reduce((sum, d) => {
    const dx = boneX - d.x;
    const dy = boneY - d.y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0) / dogs.length : 300;
  const searchTime = 3000 + avgDist * 4; // más lejos = más tiempo

  // Los perros entran en modo SNIFF y se mueven hacia el hueso
  dogs.forEach(dog => {
    dog.state = STATES.SNIFF;
    dog.stateTime = 999;
    dog.sniffTarget = { x: boneX, y: boneY };
    // Agregar anillo de olfateo encima de cada perro
    const ring = document.createElement('div');
    ring.className = 'sniff-ring';
    ring.style.left = (dog.x + dog.w / 2) + 'px';
    ring.style.top = (dog.y + dog.h / 2) + 'px';
    scene.appendChild(ring);
    hideboneState.sniffEls.push({ ring, dog });
  });

  // Después del tiempo de búsqueda, el más cercano lo "encuentra"
  hideboneState.searchTimeout = setTimeout(() => foundBone(), searchTime);
}

function foundBone() {
  if (!hideboneState) return;
  const { dogs, boneX, boneY, sniffEls } = hideboneState;
  // El perro más cercano al hueso lo encuentra
  let closest = dogs[0];
  let minD = Infinity;
  dogs.forEach(d => {
    const dx = boneX - d.x;
    const dy = boneY - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minD) { minD = dist; closest = d; }
  });
  // Limpiar anillos
  sniffEls.forEach(({ ring }) => ring.remove());
  hideboneState.sniffEls = [];
  // Celebrar
  showFloating(boneX, boneY - 20, '🎉');
  showFloating(closest.x + closest.w / 2, closest.y, '🦴');
  showToast('¡' + closest.name + ' encontró el hueso! 🦴🎉');
  showGameBanner('🦴 ¡Encontrado! Tocá 🏞️ para jugar de nuevo');
  dogs.forEach(d => { d.state = STATES.IDLE; d.stateTime = 1; d.sniffTarget = null; });
  hideboneState.hidden = false; // Permitir nuevo juego
  // Reusar: esperar que el usuario vuelva a abrir juegos
}

function updateHidebone(dt) {
  if (!hideboneState || !hideboneState.hidden) return;
  // Mover perros hacia el hueso (lentamente, como buscando)
  hideboneState.dogs.forEach(dog => {
    if (dog.state !== STATES.SNIFF || !dog.sniffTarget) return;
    const tx = dog.sniffTarget.x;
    const ty = dog.sniffTarget.y;
    const dx = tx - (dog.x + dog.w / 2);
    const dy = ty - (dog.y + dog.h / 2);
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 30) {
      // Movimiento errático: dirección general + ruido
      const noise = (Math.random() - 0.5) * 60;
      const nx = dx + noise;
      const ny = dy + noise;
      const nd = Math.sqrt(nx * nx + ny * ny) || 1;
      const speed = 45 * (dog.speed || 1);
      dog.x += (nx / nd) * speed * dt;
      dog.y += (ny / nd) * speed * dt;
      dog.dir = dx >= 0 ? 1 : -1;
    }
    // Actualizar anillo de sniff
    const sEl = hideboneState.sniffEls.find(s => s.dog === dog);
    if (sEl) {
      sEl.ring.style.left = (dog.x + dog.w / 2) + 'px';
      sEl.ring.style.top = (dog.y + dog.h / 2) + 'px';
    }
  });
}

function stopHidebone() {
  if (!hideboneState) return;
  clearTimeout(hideboneState.searchTimeout);
  const db = hideboneState.dragBone;
  if (db) {
    db.removeEventListener('pointerdown', hideboneState._onDown);
    db.removeEventListener('pointermove', hideboneState._onMove);
    db.removeEventListener('pointerup', hideboneState._onUp);
    if (db.parentNode) db.remove();
  }
  hideboneState.sniffEls.forEach(({ ring }) => ring.remove());
  hideboneState.dogs.forEach(d => { if (d.state === STATES.SNIFF) { d.state = STATES.IDLE; d.stateTime = 1; } });
  const instrEl = document.getElementById('hideboneInstr');
  if (instrEl) instrEl.remove();
  hideboneState = null;
}

function drawFishingRod() {
  if (!fishingState || !fishingState.rctx || !fishingState.fisher) return;
  const { fisher, pondX, pondY, pondW, pondH, rctx } = fishingState;
  if (!fisher.w) return;

  rctx.clearRect(0, 0, W, H);

  const handleX = fisher.x + fisher.w * 0.82;
  const handleY = fisher.y + fisher.h * 0.28;
  const tipX = pondX + pondW * 0.28;
  const tipY = pondY - pondH * 0.08;

  const bobPhase = Date.now() / 700;
  const sinkOffset = fishingState.phase === 'bite' ? 8 : 0;
  const bobberX = pondX + pondW * 0.38;
  const bobberY = pondY + pondH * 0.22 + Math.sin(bobPhase) * 3 + sinkOffset;

  rctx.save();

  // Caña con gradiente madera
  const grad = rctx.createLinearGradient(handleX, handleY, tipX, tipY);
  grad.addColorStop(0, '#4e342e');
  grad.addColorStop(1, '#8d6e63');
  rctx.strokeStyle = grad;
  rctx.lineWidth = 4.5;
  rctx.lineCap = 'round';
  rctx.beginPath();
  rctx.moveTo(handleX, handleY);
  rctx.lineTo(tipX, tipY);
  rctx.stroke();

  // Brillo de la caña
  rctx.strokeStyle = 'rgba(255,220,180,0.3)';
  rctx.lineWidth = 1.5;
  rctx.beginPath();
  rctx.moveTo(handleX - 1, handleY - 2);
  rctx.lineTo(tipX - 1, tipY - 2);
  rctx.stroke();

  // Línea de pesca con curva suave
  rctx.strokeStyle = 'rgba(220,230,255,0.92)';
  rctx.lineWidth = 1.3;
  rctx.beginPath();
  rctx.moveTo(tipX, tipY);
  rctx.quadraticCurveTo((tipX + bobberX) / 2, (tipY + bobberY) / 2 + 20, bobberX, bobberY);
  rctx.stroke();

  // Flotador: mitad roja arriba, mitad blanca abajo
  rctx.fillStyle = '#e53935';
  rctx.beginPath();
  rctx.ellipse(bobberX, bobberY - 2, 5, 3.5, 0, 0, Math.PI);
  rctx.fill();
  rctx.fillStyle = '#f0f0f0';
  rctx.beginPath();
  rctx.ellipse(bobberX, bobberY + 2, 5, 3.5, 0, Math.PI, Math.PI * 2);
  rctx.fill();
  rctx.strokeStyle = 'rgba(0,0,0,0.25)';
  rctx.lineWidth = 0.8;
  rctx.beginPath();
  rctx.ellipse(bobberX, bobberY, 5, 3.5, 0, 0, Math.PI * 2);
  rctx.stroke();

  // Signo ! cuando pica (grande y visible)
  if (fishingState.phase === 'bite') {
    rctx.font = 'bold 28px sans-serif';
    rctx.textAlign = 'center';
    rctx.fillStyle = '#ffeb3b';
    rctx.strokeStyle = '#e65100';
    rctx.lineWidth = 3;
    rctx.strokeText('!', bobberX, bobberY - 22);
    rctx.fillText('!', bobberX, bobberY - 22);
  }

  rctx.restore();
}

// ============================================
// ESCENARIOS
// ============================================
