// ============ INTERFAZ Y NOTIFICACIONES ============

function openGames() { document.getElementById('gamesBg').classList.add('show'); }
function closeGames() { document.getElementById('gamesBg').classList.remove('show'); }
document.getElementById('gamesBg').addEventListener('click', (e) => {
  if (e.target.id === 'gamesBg') closeGames();
});
document.getElementById('raceBetBg').addEventListener('click', (e) => {
  if (e.target.id === 'raceBetBg') closeRaceBet(true);
});
document.getElementById('raceSelectBg').addEventListener('click', (e) => {
  if (e.target.id === 'raceSelectBg') closeRaceSelect(true);
});

function renderAnimalList() {
  const list = document.getElementById('animalList');
  list.innerHTML = '';
  ANIMAL_DATA.forEach(a => {
    const card = document.createElement('div');
    card.className = 'animal-card' + (activeKeys.has(a.key) ? ' active' : '');
    card.innerHTML = '<div class="check">✓</div><img src="' + a.src + '" alt="' + a.name + '"><div class="name">' + a.name + '</div>';
    card.addEventListener('click', () => {
      if (activeKeys.has(a.key)) activeKeys.delete(a.key);
      else activeKeys.add(a.key);
      saveActive();
      renderAnimalList();
    });
    list.appendChild(card);
  });
}
function saveActive() { localStorage.setItem('active_animals', JSON.stringify([...activeKeys])); }
function openSelector() {
  renderAnimalList();
  document.getElementById('modalBg').classList.add('show');
}
function closeSelector() {
  document.getElementById('modalBg').classList.remove('show');
  rebuildAnimals();
}
function toggleAll() {
  if (activeKeys.size === ANIMAL_DATA.length) activeKeys.clear();
  else ANIMAL_DATA.forEach(a => activeKeys.add(a.key));
  saveActive();
  renderAnimalList();
}
document.getElementById('modalBg').addEventListener('click', (e) => {
  if (e.target.id === 'modalBg') closeSelector();
});

let swReg = null;
let notifsEnabled = false;

async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    // Forzar a buscar sw.js sin cache cuando se registra
    swReg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
    
    // Detectar cuando hay un SW nuevo y activarlo automáticamente
    swReg.addEventListener('updatefound', () => {
      const newSW = swReg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          if (swReg.waiting) swReg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    // Buscar updates al abrir y cada 30 minutos
    swReg.update().catch(() => {});
    setInterval(() => { if (swReg) swReg.update().catch(() => {}); }, 30 * 60 * 1000);

    // Mostrar versión activa en el indicador
    const activeSW = swReg.active || (await navigator.serviceWorker.ready).active;
    if (activeSW) activeSW.postMessage({ type: 'GET_VERSION' });
    
    return swReg;
  } catch(e) { console.warn('SW falló:', e); return null; }
}

// Cuando el SW envía mensajes a la página
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'VERSION') {
      const el = document.getElementById('appVersion');
      if (el) el.textContent = 'v' + event.data.version;
    }
  });
  
  // Cuando el SW que controla la página cambia, recargar (pero solo una vez)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('[App] Recargando por nueva versión...');
    window.location.reload();
  });
}

function showUpdateAvailable() {
  // Mostrar un toast con botón para actualizar
  const existingBanner = document.getElementById('updateBanner');
  if (existingBanner) return;
  
  const banner = document.createElement('div');
  banner.id = 'updateBanner';
  banner.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#4caf50;color:white;padding:10px 18px;border-radius:20px;font-size:14px;z-index:300;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;gap:10px;align-items:center;';
  banner.innerHTML = '<span>✨ Nueva versión disponible</span><button id="updateBtn" style="background:white;color:#4caf50;border:none;padding:6px 12px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;">Actualizar</button>';
  document.body.appendChild(banner);
  document.getElementById('updateBtn').onclick = () => {
    if (swReg && swReg.waiting) {
      swReg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    banner.remove();
  };
}

// Buscar updates cuando la app vuelve al foco (volviste de otra pestaña/app)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && swReg) {
    swReg.update().catch(() => {});
  }
});

function updateSwitchUI() {
  const sw = document.getElementById('notifSwitch');
  if (notifsEnabled) sw.classList.add('on');
  else sw.classList.remove('on');
}
function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent); }
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

async function toggleNotifs() {
  if (notifsEnabled) {
    notifsEnabled = false;
    localStorage.removeItem('notifs_on');
    localStorage.removeItem('next_notif');
    if (swReg && swReg.active) swReg.active.postMessage({ type: 'CANCEL_NOTIF' });
    updateSwitchUI();
    showToast('Notificaciones desactivadas');
    return;
  }
  if (!('Notification' in window)) {
    showToast('Tu navegador no soporta notificaciones 😢');
    return;
  }
  if (isIOS() && !isStandalone()) {
    document.getElementById('iosHint').classList.add('show');
    return;
  }
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm === 'granted') {
    notifsEnabled = true;
    localStorage.setItem('notifs_on', '1');
    updateSwitchUI();
    if (!swReg) swReg = await registerSW();
    if (!swReg) { showToast('No se pudo registrar 😢'); return; }
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) reg.active.postMessage({ type: 'TEST_NOTIF' });
    showToast('¡Listo! Te avisaremos 💕');
    scheduleNext();
  } else {
    showToast('Sin permisos no podemos avisarte 😢');
  }
}

function scheduleNext() {
  if (!notifsEnabled || !swReg || !swReg.active) return;
  const minMs = 2 * 60 * 60 * 1000;
  const maxMs = 6 * 60 * 60 * 1000;
  const delay = minMs + Math.random() * (maxMs - minMs);
  localStorage.setItem('next_notif', String(Date.now() + delay));
  swReg.active.postMessage({ type: 'SCHEDULE_NOTIF', delay });
}

async function checkPendingNotifs() {
  const on = localStorage.getItem('notifs_on') === '1';
  if (!on) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    localStorage.removeItem('notifs_on');
    return;
  }
  notifsEnabled = true;
  updateSwitchUI();
  if (!swReg) await registerSW();
  if (!swReg) return;
  await navigator.serviceWorker.ready;
  const next = parseInt(localStorage.getItem('next_notif') || '0');
  const now = Date.now();
  let delay;
  if (!next || next <= now) {
    const minMs = 2 * 60 * 60 * 1000;
    const maxMs = 6 * 60 * 60 * 1000;
    delay = minMs + Math.random() * (maxMs - minMs);
    localStorage.setItem('next_notif', String(Date.now() + delay));
  } else {
    delay = next - now;
  }
  if (swReg.active) swReg.active.postMessage({ type: 'SCHEDULE_NOTIF', delay });
}

// ============================================
// MINIJUEGO: FETCH

let currentScene = localStorage.getItem('current_scene') || 'jardin';

function applyScene(key) {
  currentScene = key;
  localStorage.setItem('current_scene', key);
  const scene_data = SCENES.find(s => s.key === key);
  const bgEl = document.getElementById('sceneBg');
  if (!scene_data || !scene_data.src) {
    bgEl.style.backgroundImage = 'none';
    bgEl.style.opacity = '0';
    // Volver al fondo generado
    document.getElementById('bg').style.opacity = '1';
  } else {
    bgEl.style.backgroundImage = `url(${scene_data.src})`;
    bgEl.style.opacity = '1';
    // Ocultar canvas generado (el fondo imagen lo reemplaza)
    document.getElementById('bg').style.opacity = '0';
  }
  // Actualizar los indicadores
  document.querySelectorAll('.scene-thumb').forEach(el => {
    el.classList.toggle('active', el.dataset.key === key);
  });
}

function openSceneSelector() {
  const container = document.getElementById('sceneSelector');
  container.innerHTML = '';
  SCENES.forEach(s => {
    const thumb = document.createElement('div');
    thumb.className = 'scene-thumb' + (s.key === currentScene ? ' active' : '');
    thumb.dataset.key = s.key;
    if (s.src) {
      thumb.style.backgroundImage = `url(${s.src})`;
    } else {
      // Escenario generado: fondo verde
      thumb.style.background = 'linear-gradient(180deg, #8dd05e, #6ab048)';
    }
    thumb.innerHTML = `<div class="scene-label">${s.emoji} ${s.name}</div>`;
    thumb.addEventListener('click', () => {
      applyScene(s.key);
      closeSceneSelector();
    });
    container.appendChild(thumb);
  });
  document.getElementById('sceneBg_modal').classList.add('show');
}

function closeSceneSelector() {
  document.getElementById('sceneBg_modal').classList.remove('show');
}

document.getElementById('sceneBg_modal').addEventListener('click', (e) => {
  if (e.target.id === 'sceneBg_modal') closeSceneSelector();
});
