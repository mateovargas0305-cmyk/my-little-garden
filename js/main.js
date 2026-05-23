// ============ INICIALIZACIÓN ============

function init() {
  resize();
  rebuildAnimals();
  updateTimeOfDay();
  currentWeather = pickRandomWeather();
  weatherChangeAt = Date.now() + (3 + Math.random() * 5) * 60 * 1000;
  requestAnimationFrame(loop);
  registerSW().then(() => { setTimeout(checkPendingNotifs, 500); });
  // Aplicar escenario guardado
  setTimeout(() => applyScene(currentScene), 100);
  setTimeout(() => showToast('¡Bienvenido! Tocá los animalitos 💕'), 800);
  setTimeout(() => {
    const w = WEATHERS[currentWeather];
    showToast(w.emoji + ' ' + w.name);
  }, 2500);
}

init();
