// ============ SONIDOS SINTETIZADOS ============
// Web Audio API — sin archivos externos

let _audioCtx = null;

function _ctx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (_) { return null; }
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(() => {});
  return _audioCtx.state === 'running' ? _audioCtx : null;
}

// Desbloquear AudioContext en el primer gesto
document.addEventListener('pointerdown', function unlock() {
  _ctx();
  document.removeEventListener('pointerdown', unlock);
}, { passive: true });

function _tone(freq, dur, type, vol, startTime) {
  const c = _ctx();
  if (!c) return;
  const t = (startTime !== undefined) ? startTime : c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol || 0.22, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

// Caricia / pet
function soundPet() {
  const c = _ctx(); if (!c) return;
  _tone(500, 0.10, 'sine', 0.22, c.currentTime);
  _tone(700, 0.14, 'sine', 0.18, c.currentTime + 0.07);
}

// Éxtasis (ronroneo)
function soundEcstasy() {
  const c = _ctx(); if (!c) return;
  const osc  = c.createOscillator();
  const lfo  = c.createOscillator();
  const lfoG = c.createGain();
  const gain = c.createGain();
  lfo.frequency.value = 28;
  lfoG.gain.value = 25;
  lfo.connect(lfoG);
  lfoG.connect(osc.frequency);
  osc.frequency.value = 105;
  osc.type = 'sawtooth';
  osc.connect(gain);
  gain.connect(c.destination);
  gain.gain.setValueAtTime(0.09, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.9);
  lfo.start(c.currentTime);
  osc.start(c.currentTime);
  lfo.stop(c.currentTime + 0.9);
  osc.stop(c.currentTime + 0.91);
}

// Comer
function soundEat() {
  const c = _ctx(); if (!c) return;
  [0, 0.09, 0.18].forEach((dt, i) => {
    _tone(280 - i * 40, 0.12, 'sine', 0.20, c.currentTime + dt);
  });
}

// Tirar comida
function soundFoodDrop() {
  const c = _ctx(); if (!c) return;
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(250, c.currentTime + 0.35);
  gain.gain.setValueAtTime(0.20, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.35);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.36);
}

// Lanzar pelota
function soundToyThrow() {
  const c = _ctx(); if (!c) return;
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(900, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.25);
  gain.gain.setValueAtTime(0.22, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.26);
}

// Amigos se encuentran (arpeggio C-E-G)
function soundFriendMeet() {
  const c = _ctx(); if (!c) return;
  [[523, 0], [659, 0.11], [784, 0.22]].forEach(([f, dt]) => {
    _tone(f, 0.30, 'sine', 0.13, c.currentTime + dt);
  });
}

// Enemigos se encuentran (disonancia grave)
function soundEnemyMeet() {
  const c = _ctx(); if (!c) return;
  _tone(75, 0.45, 'sawtooth', 0.12, c.currentTime);
  _tone(82, 0.40, 'sawtooth', 0.09, c.currentTime + 0.04);
}

// Logro desbloqueado
function soundAchievement() {
  const c = _ctx(); if (!c) return;
  [[523, 0], [659, 0.14], [784, 0.28], [1046, 0.42]].forEach(([f, dt]) => {
    _tone(f, 0.32, 'triangle', 0.28, c.currentTime + dt);
  });
}

// Pez pica
function soundFishBite() {
  const c = _ctx(); if (!c) return;
  [0, 0.10, 0.20].forEach(dt => {
    _tone(900, 0.07, 'square', 0.22, c.currentTime + dt);
  });
}

// Largada de carrera (beep beep ¡YA!)
function soundRaceStart() {
  const c = _ctx(); if (!c) return;
  _tone(550, 0.15, 'square', 0.20, c.currentTime);
  _tone(550, 0.15, 'square', 0.20, c.currentTime + 0.22);
  _tone(1100, 0.40, 'square', 0.26, c.currentTime + 0.44);
}
