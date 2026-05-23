// ============ PERSONALIDADES Y RELACIONES ============

const PERSONALITIES = {
  gatina:   { type: 'cariñoso' },
  maximo:   { type: 'dormilón' },
  meme:     { type: 'salvaje'  },
  roedor:   { type: 'ansioso'  },
  teo:      { type: 'cariñoso' },
  uma:      { type: 'dormilón' },
  pepa:     { type: 'salvaje'  },
  hamilton: { type: 'ansioso'  },
  filippa:  { type: 'cariñoso' },
};

const RELATIONSHIPS = {
  gatina:   { friends: ['teo', 'filippa'],          enemies: ['meme'] },
  maximo:   { friends: ['uma'],                     enemies: ['pepa'] },
  meme:     { friends: ['maximo'],                  enemies: ['roedor', 'hamilton'] },
  roedor:   { friends: ['pepa'],                    enemies: ['meme', 'gatina'] },
  teo:      { friends: ['gatina', 'filippa'],       enemies: [] },
  uma:      { friends: ['maximo', 'filippa'],       enemies: [] },
  pepa:     { friends: ['roedor', 'teo'],           enemies: ['maximo'] },
  hamilton: { friends: ['filippa', 'teo'],          enemies: ['meme'] },
  filippa:  { friends: ['gatina', 'teo', 'uma'],    enemies: [] },
};

// Parámetros de comportamiento por tipo de personalidad
const PERS_PARAMS = {
  dormilón: { sleepMult: 2.8, speedMult: 0.70, idleMult: 2.2, walkTimeMult: 1.5 },
  cariñoso: { sleepMult: 0.7, speedMult: 1.00, idleMult: 1.0, walkTimeMult: 1.0 },
  ansioso:  { sleepMult: 0.4, speedMult: 1.35, idleMult: 0.5, walkTimeMult: 0.4 },
  salvaje:  { sleepMult: 0.2, speedMult: 1.45, idleMult: 0.5, walkTimeMult: 0.7 },
};

// Display info por tipo
const PERS_DISPLAY = {
  'dormilón': { emoji: '😴', label: 'Dormilón', accent: '#29b6f6' },
  'cariñoso': { emoji: '💕', label: 'Cariñoso', accent: '#ec407a' },
  'ansioso':  { emoji: '😰', label: 'Ansioso',  accent: '#ff9800' },
  'salvaje':  { emoji: '😤', label: 'Salvaje',  accent: '#e53935' },
};

function loadPersonalities() {
  try {
    const s = JSON.parse(localStorage.getItem('jardincito_pers') || 'null');
    if (s) {
      if (s.personalities) Object.keys(s.personalities).forEach(k => {
        if (PERSONALITIES[k]) PERSONALITIES[k] = s.personalities[k];
      });
      if (s.relationships) Object.keys(s.relationships).forEach(k => {
        if (RELATIONSHIPS[k]) RELATIONSHIPS[k] = s.relationships[k];
      });
    }
  } catch(e) {}
}

function savePersonalities() {
  localStorage.setItem('jardincito_pers', JSON.stringify({
    personalities: PERSONALITIES,
    relationships: RELATIONSHIPS,
  }));
}

loadPersonalities();
