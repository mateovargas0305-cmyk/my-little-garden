// ============ SISTEMA DE LOGROS ============

const ACHIEVEMENTS = [
  // Caricias
  { id: 'first_pet',      emoji: '💕', name: '¡Primer miau!',         desc: 'Tocaste una mascota por primera vez',           check: s => s.pets >= 1 },
  { id: 'gentle_hands',   emoji: '🤲', name: 'Mano suave',             desc: 'Acariciaste 50 veces',                         check: s => s.pets >= 50 },
  { id: 'pet_whisperer',  emoji: '✨', name: 'Encantador',             desc: 'Acariciaste 500 veces',                        check: s => s.pets >= 500 },
  // Éxtasis
  { id: 'first_ecstasy',  emoji: '💖', name: '¡Éxtasis!',             desc: 'Pusiste a una mascota en éxtasis',             check: s => s.ecstasy >= 1 },
  { id: 'ecstasy_master', emoji: '🌟', name: 'Maestro del éxtasis',   desc: '20 sesiones de éxtasis',                      check: s => s.ecstasy >= 20 },
  // Comida
  { id: 'first_food',     emoji: '🦴', name: '¡A comer!',             desc: 'Tiraste comida por primera vez',               check: s => s.fed >= 1 },
  { id: 'chef',           emoji: '👨‍🍳', name: 'Chef del jardín',       desc: 'Tiraste comida 30 veces',                     check: s => s.fed >= 30 },
  // Juguetes
  { id: 'first_toy',      emoji: '🔴', name: '¡A jugar!',             desc: 'Tiraste la primera pelota',                   check: s => s.toys >= 1 },
  { id: 'toy_thrower',    emoji: '🎾', name: 'Lanzador estrella',      desc: 'Tiraste 20 pelotas',                          check: s => s.toys >= 20 },
  // Láser
  { id: 'first_laser',    emoji: '🔴', name: 'Cazador de luces',       desc: 'Jugaste con el láser por primera vez',        check: s => s.laserSessions >= 1 },
  { id: 'laser_pro',      emoji: '⚡', name: 'Maestro láser',          desc: '10 sesiones de láser',                        check: s => s.laserSessions >= 10 },
  // Carrera
  { id: 'first_race',     emoji: '🏁', name: '¡En sus marcas!',       desc: 'Completaste tu primera carrera',              check: s => s.races >= 1 },
  { id: 'winner',         emoji: '🏆', name: '¡Apostaste bien!',      desc: 'Acertaste en una apuesta de carrera',         check: s => s.racesWon >= 1 },
  { id: 'race_master',    emoji: '🥇', name: 'Apostador experto',      desc: 'Ganaste 5 apuestas de carrera',               check: s => s.racesWon >= 5 },
  // Pesca
  { id: 'first_fish',     emoji: '🎣', name: '¡El primero!',          desc: 'Pescaste tu primer pez',                      check: s => s.fishCaught >= 1 },
  { id: 'fisher',         emoji: '🐟', name: 'Pescador',               desc: 'Pescaste 10 peces',                           check: s => s.fishCaught >= 10 },
  { id: 'big_fisher',     emoji: '🦈', name: 'Tiburón',                desc: 'Pescaste 30 peces',                           check: s => s.fishCaught >= 30 },
  // Fetch
  { id: 'first_fetch',    emoji: '🦴', name: '¡Trae!',                desc: 'Los perros trajeron el hueso por primera vez', check: s => s.bonesFetched >= 1 },
  { id: 'fetch_master',   emoji: '🐕', name: 'Fetch campeón',          desc: '15 huesos traídos',                           check: s => s.bonesFetched >= 15 },
  // Esconder hueso
  { id: 'first_hide',     emoji: '🐽', name: 'Escondedor',             desc: 'Escondiste el hueso por primera vez',         check: s => s.bonesHidden >= 1 },
  { id: 'hide_master',    emoji: '🕵️', name: 'Maestro del escondite', desc: 'Escondiste el hueso 10 veces',                check: s => s.bonesHidden >= 10 },
  // Colección
  { id: 'all_games',      emoji: '🎮', name: 'Todo jugado',            desc: 'Jugaste todos los minijuegos al menos una vez', check: s => s.laserSessions >= 1 && s.races >= 1 && s.fishCaught >= 1 && s.bonesFetched >= 1 && s.bonesHidden >= 1 && s.ecstasy >= 1 },
  { id: 'dedicated',      emoji: '🌷', name: 'Jardinero dedicado',     desc: 'Jugaste 7 días distintos',                    check: s => s.daysPlayed >= 7 },
];

// ─── STATS ────────────────────────────────────────────
const _STATS_KEY    = 'jardincito_stats';
const _UNLOCKED_KEY = 'jardincito_unlocked';
const _DAYS_KEY     = 'jardincito_days';

let achStats = {
  pets: 0, ecstasy: 0, fed: 0, toys: 0,
  laserSessions: 0, races: 0, racesWon: 0,
  fishCaught: 0, bonesFetched: 0, bonesHidden: 0,
  daysPlayed: 0,
};
let unlockedIds = new Set();

function loadAchievements() {
  try { Object.assign(achStats, JSON.parse(localStorage.getItem(_STATS_KEY) || '{}')); } catch(_) {}
  try {
    const u = JSON.parse(localStorage.getItem(_UNLOCKED_KEY) || '[]');
    unlockedIds = new Set(Array.isArray(u) ? u : []);
  } catch(_) {}
  _trackDay();
}

function _trackDay() {
  const today = new Date().toISOString().slice(0, 10);
  let days = [];
  try { days = JSON.parse(localStorage.getItem(_DAYS_KEY) || '[]'); } catch(_) {}
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem(_DAYS_KEY, JSON.stringify(days));
    achStats.daysPlayed = days.length;
    _saveStats();
  }
}

function _saveStats() {
  localStorage.setItem(_STATS_KEY, JSON.stringify(achStats));
}

function trackStat(key, amount) {
  if (!(key in achStats)) return;
  achStats[key] = (achStats[key] || 0) + (amount || 1);
  _saveStats();
  checkAchievements();
}

function checkAchievements() {
  let newUnlock = false;
  ACHIEVEMENTS.forEach(a => {
    if (unlockedIds.has(a.id)) return;
    if (a.check(achStats)) {
      unlockedIds.add(a.id);
      newUnlock = true;
      _showAchievementUnlock(a);
    }
  });
  if (newUnlock) {
    localStorage.setItem(_UNLOCKED_KEY, JSON.stringify([...unlockedIds]));
    _updateAchievementBadge();
  }
}

// ─── POPUP AL DESBLOQUEAR ─────────────────────────────
let _achQueue = [];
let _achShowing = false;

function _showAchievementUnlock(a) {
  _achQueue.push(a);
  if (!_achShowing) _nextAchPopup();
}

function _nextAchPopup() {
  if (_achQueue.length === 0) { _achShowing = false; return; }
  _achShowing = true;
  const a = _achQueue.shift();

  if (!document.getElementById('achPopStyle')) {
    const s = document.createElement('style');
    s.id = 'achPopStyle';
    s.textContent = `
      @keyframes achPopIn  { from { opacity:0; transform:translateX(-50%) scale(0.5) translateY(20px); } to { opacity:1; transform:translateX(-50%) scale(1) translateY(0); } }
      @keyframes achPopOut { from { opacity:1; transform:translateX(-50%) scale(1); } to { opacity:0; transform:translateX(-50%) scale(0.8) translateY(-10px); } }
    `;
    document.head.appendChild(s);
  }

  const popup = document.createElement('div');
  popup.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#fff8e1,#ffe082);border:3px solid #ffd54f;border-radius:20px;padding:12px 18px;z-index:600;display:flex;align-items:center;gap:12px;box-shadow:0 6px 24px rgba(0,0,0,0.3);max-width:88vw;animation:achPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;';
  popup.innerHTML = `<span style="font-size:34px;flex-shrink:0">${a.emoji}</span><div><div style="font-size:10px;font-weight:800;color:#e65100;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">¡Logro desbloqueado!</div><div style="font-size:15px;font-weight:800;color:#4e342e">${a.name}</div><div style="font-size:11px;color:#6d4c41;margin-top:3px;line-height:1.3">${a.desc}</div></div>`;
  document.body.appendChild(popup);
  soundAchievement();

  setTimeout(() => {
    popup.style.animation = 'achPopOut 0.35s ease-in forwards';
    setTimeout(() => { popup.remove(); _nextAchPopup(); }, 350);
  }, 3200);
}

// ─── BADGE ────────────────────────────────────────────
function _updateAchievementBadge() {
  const badge = document.getElementById('achBadge');
  if (!badge) return;
  const count = unlockedIds.size;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

// ─── MODAL ────────────────────────────────────────────
function openAchievements() {
  const list = document.getElementById('achievementList');
  list.innerHTML = '';

  const unlocked = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id));
  const locked   = ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id));

  const makeCard = (a, isUnlocked) => {
    const card = document.createElement('div');
    card.className = 'ach-card' + (isUnlocked ? ' unlocked' : '');
    card.innerHTML = `<div class="ach-emoji">${isUnlocked ? a.emoji : '🔒'}</div><div class="ach-name">${isUnlocked ? a.name : '???'}</div><div class="ach-desc">${isUnlocked ? a.desc : 'Seguí jugando para descubrir'}</div>`;
    list.appendChild(card);
  };

  unlocked.forEach(a => makeCard(a, true));
  locked.forEach(a => makeCard(a, false));

  document.getElementById('achCount').textContent = `${unlocked.length} / ${ACHIEVEMENTS.length} desbloqueados`;
  document.getElementById('achBg').classList.add('show');
}

function closeAchievements() {
  document.getElementById('achBg').classList.remove('show');
}

document.getElementById('achBg').addEventListener('click', e => {
  if (e.target.id === 'achBg') closeAchievements();
});

// ─── ARRANQUE ─────────────────────────────────────────
loadAchievements();
setTimeout(() => { _updateAchievementBadge(); checkAchievements(); }, 0);
