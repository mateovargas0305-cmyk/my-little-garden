// ============ SONIDOS SINTETIZADOS v2 ============
// Técnicas: filtrado lowpass, detuning, ruido blanco, harmónicos, envelopes suaves

let _audioCtx = null;

function _ctx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (_) { return null; }
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(() => {});
  return _audioCtx.state === 'running' ? _audioCtx : null;
}

document.addEventListener('pointerdown', function unlock() {
  _ctx();
  document.removeEventListener('pointerdown', unlock);
}, { passive: true });

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Tono con filtro lowpass y detune opcional
function _tone(freq, dur, type, vol, startAt, filterHz, detuneCents) {
  const c = _ctx(); if (!c) return;
  const t = (startAt !== undefined) ? startAt : c.currentTime;
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (detuneCents) osc.detune.value = detuneCents;
  let node = osc;
  if (filterHz) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filterHz; f.Q.value = 0.55;
    osc.connect(f); node = f;
  }
  node.connect(gain); gain.connect(c.destination);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.013);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t); osc.stop(t + dur + 0.02);
}

// Ruido blanco filtrado
function _noise(dur, vol, filterHz, filterType, startAt) {
  const c = _ctx(); if (!c) return;
  const t   = (startAt !== undefined) ? startAt : c.currentTime;
  const len = Math.ceil(c.sampleRate * (dur + 0.05));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src  = c.createBufferSource(); src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type  = filterType || 'lowpass';
  filt.frequency.value = filterHz || 1500;
  const g = c.createGain();
  src.connect(filt); filt.connect(g); g.connect(c.destination);
  g.gain.setValueAtTime(vol || 0.1, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.start(t); src.stop(t + dur + 0.05);
}

// ─── SONIDOS ──────────────────────────────────────────────────────────────────

// Caricia — par de sines levemente detuneados + toque de noise
function soundPet() {
  const c = _ctx(); if (!c) return;
  const t = c.currentTime;
  _tone(440, 0.22, 'sine', 0.18, t,        2600);
  _tone(440, 0.22, 'sine', 0.09, t,        2600,  8);   // +8 cents
  _tone(660, 0.17, 'sine', 0.13, t + 0.10, 3000);
  _tone(660, 0.17, 'sine', 0.07, t + 0.10, 3000, -8);
  _noise(0.06, 0.04, 1200, 'lowpass', t);
}

// Éxtasis — ronroneo: sine grave + vibrato lento + pulso de noise
function soundEcstasy() {
  const c = _ctx(); if (!c) return;
  const dur = 1.0;
  const osc  = c.createOscillator();
  const vib  = c.createOscillator();
  const vibG = c.createGain();
  const filt = c.createBiquadFilter();
  const gain = c.createGain();
  vib.frequency.value = 5;    // vibrato 5 Hz
  vibG.gain.value = 10;       // ±10 cents
  vib.connect(vibG); vibG.connect(osc.detune);
  osc.type = 'sine'; osc.frequency.value = 125;
  filt.type = 'lowpass'; filt.frequency.value = 520;
  osc.connect(filt); filt.connect(gain); gain.connect(c.destination);
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.06);
  gain.gain.setValueAtTime(0.18, c.currentTime + dur - 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  vib.start(c.currentTime); vib.stop(c.currentTime + dur);
  osc.start(c.currentTime); osc.stop(c.currentTime + dur + 0.02);
  // Textura grave del "rrr"
  _noise(dur, 0.07, 260, 'bandpass', c.currentTime);
}

// Comer — 3 "nom" = noise bandpass corto + tono grave suave
function soundEat() {
  const c = _ctx(); if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 3; i++) {
    const dt = t + i * 0.115;
    _noise(0.09, 0.12, 1000, 'bandpass', dt);
    _tone(185 - i * 22, 0.11, 'sine', 0.10, dt, 520);
  }
}

// Tirar comida — silbido descendente + impacto suave
function soundFoodDrop() {
  const c = _ctx(); if (!c) return;
  const t = c.currentTime;
  const osc  = c.createOscillator();
  const filt = c.createBiquadFilter();
  const gain = c.createGain();
  filt.type = 'lowpass'; filt.frequency.value = 3200;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(750, t);
  osc.frequency.exponentialRampToValueAtTime(210, t + 0.38);
  osc.connect(filt); filt.connect(gain); gain.connect(c.destination);
  gain.gain.setValueAtTime(0.17, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  osc.start(t); osc.stop(t + 0.40);
  _noise(0.10, 0.09, 700, 'bandpass', t + 0.34);
}

// Lanzar pelota — whoosh: noise con bandpass que barre
function soundToyThrow() {
  const c = _ctx(); if (!c) return;
  const t   = c.currentTime;
  const len = Math.ceil(c.sampleRate * 0.42);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src  = c.createBufferSource(); src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'bandpass'; filt.Q.value = 3;
  filt.frequency.setValueAtTime(220, t);
  filt.frequency.linearRampToValueAtTime(2600, t + 0.14);
  filt.frequency.exponentialRampToValueAtTime(320, t + 0.42);
  const g = c.createGain();
  src.connect(filt); filt.connect(g); g.connect(c.destination);
  g.gain.setValueAtTime(0.20, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  src.start(t); src.stop(t + 0.44);
}

// Amigos se encuentran — acorde C5-E5-G5 cálido con 3 osciladores detuneados
function soundFriendMeet() {
  const c = _ctx(); if (!c) return;
  const t = c.currentTime;
  [[523.25, 0], [659.25, 0.13], [783.99, 0.26]].forEach(([freq, dt]) => {
    _tone(freq,         0.65, 'sine', 0.11, t + dt, 4000,   0);
    _tone(freq * 1.004, 0.60, 'sine', 0.06, t + dt, 3600,   7);
    _tone(freq * 0.996, 0.60, 'sine', 0.05, t + dt, 3600,  -7);
  });
}

// Enemigos se encuentran — gruñido: noise grave + disonancia filtrada
function soundEnemyMeet() {
  const c = _ctx(); if (!c) return;
  const t = c.currentTime;
  _noise(0.55, 0.13, 190, 'lowpass',  t);
  _noise(0.55, 0.07, 130, 'bandpass', t + 0.03);
  _tone(63,  0.50, 'sawtooth', 0.07, t,        290);
  _tone(70,  0.45, 'sawtooth', 0.05, t + 0.05, 270);
}

// Logro desbloqueado — fanfarria C-E-G-C con armónicos y shimmer
function soundAchievement() {
  const c = _ctx(); if (!c) return;
  const t = c.currentTime;
  [[523.25, 0], [659.25, 0.13], [783.99, 0.26], [1046.5, 0.39]].forEach(([freq, dt]) => {
    _tone(freq,     0.55, 'triangle', 0.22, t + dt, 6000);
    _tone(freq * 2, 0.38, 'sine',     0.06, t + dt, 9000); // 2° armónico
  });
  // Shimmer final
  _tone(1568, 0.75, 'sine', 0.07, t + 0.46, 8000);
  _tone(2093, 0.60, 'sine', 0.04, t + 0.56, 9000);
}

// Pez pica — "ding!" de xilofón + pequeño splash
function soundFishBite() {
  const c = _ctx(); if (!c) return;
  const t = c.currentTime;
  _tone(1200, 0.55, 'sine', 0.26, t,         7000);
  _tone(2400, 0.28, 'sine', 0.09, t + 0.006, 9000); // octava
  _tone(800,  0.35, 'sine', 0.07, t + 0.012, 5000); // sub-armónico
  _noise(0.06, 0.05, 2500, 'highpass', t);
}

// Largada de carrera — countdown + acorde de GO
function soundRaceStart() {
  const c = _ctx(); if (!c) return;
  const t = c.currentTime;
  // Dos beeps de countdown: triangle filtrado (más suave que square)
  [0, 0.28].forEach(dt => {
    _tone(660, 0.20, 'triangle', 0.22, t + dt, 3500);
    _tone(660, 0.20, 'triangle', 0.09, t + dt, 3500,  9); // leve detune
    _noise(0.04, 0.04, 2800, 'bandpass', t + dt);
  });
  // ¡YA! — acorde 3 voces
  _tone(880,  0.65, 'triangle', 0.24, t + 0.56, 5000);
  _tone(1320, 0.58, 'triangle', 0.14, t + 0.58, 6000);
  _tone(1760, 0.48, 'sine',     0.07, t + 0.60, 8000);
}
