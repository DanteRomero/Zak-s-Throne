/* Medallas: cada logro tiene su medalla, con un dibujo que lo cuenta (una noche roja, un gólem roto, una corona partida…).
   Se guardan en la partida; las que ya te correspondían de antes se entregan solas al cargarla. */
(function () {
'use strict';
const Z = window.Zak;
const flag = key => g => !!g.questFlags[key], pet = id => g => g.ownsPet(id);
// `tier`: bronce, plata u oro (el color del borde). Las que no tienen `check` se ganan en el momento (pescar, que Zak te ejecute…).
Z.MEDALS = [
 {id: 'bloodmoon', name: 'Noche roja', detail: 'Te tocó una luna roja.', tier: 'silver', check: g => g.player.bloodMoon === true && !Z.isZakDimension(g.biome)},
 {id: 'puddles', name: 'Pato de charco', detail: 'Pisaste 25 charcos bajo la lluvia.', tier: 'bronze', check: g => (g.player.puddles || 0) >= 25},
 {id: 'rainfish', name: 'Pique con lluvia', detail: 'Sacaste un pescado mientras llovía.', tier: 'bronze'},
 {id: 'dorado', name: 'Tigre del río', detail: 'Sacaste un Dorado.', tier: 'gold'},
 {id: 'capo', name: 'Anteojos rotos', detail: 'Derrotaste al Capo del Eco.', tier: 'bronze', check: flag('defeat_capo')},
 {id: 'yarara', name: 'Colmillo partido', detail: 'Derrotaste a la Yarará Madre.', tier: 'bronze', check: flag('defeat_yarara')},
 {id: 'vampire', name: 'Estaca de madera', detail: 'Derrotaste al Chupasangre.', tier: 'silver', check: flag('defeat_vampire')},
 {id: 'golem', name: 'Montaña rota', detail: 'Derrotaste al Gólem Minero.', tier: 'silver', check: flag('defeat_golem')},
 {id: 'cerbero', name: 'Tres huesos', detail: 'Derrotaste a Cerbero.', tier: 'silver', check: flag('defeat_cerbero')},
 {id: 'archmage', name: 'Sombrero caído', detail: 'Derrotaste al Rey Mago.', tier: 'gold', check: flag('defeat_archmage')},
 {id: 'zak', name: 'El trono tiembla', detail: 'Venciste a Zak.', tier: 'gold', check: flag('defeat_zak')},
 {id: 'fury', name: 'Corona partida', detail: 'Ganaste la revancha contra Zak furioso.', tier: 'gold', check: g => (g.player.furyWins || 0) > 0},
 {id: 'executed', name: 'Ni se despeinó', detail: 'Zak te ejecutó por no cruzar su portal a tiempo.', tier: 'bronze'},
 {id: 'mimic', name: 'Cofre con dientes', detail: 'Derrotaste a un mimic.', tier: 'bronze', check: flag('defeat_mimic')},
 {id: 'elemental', name: 'Filo elemental', detail: 'Forjaste la Espada Elemental.', tier: 'gold', check: g => g.player.weapons.includes('elemental')},
 {id: 'kills', name: 'Cien bajas', detail: 'Derrotaste a 100 enemigos.', tier: 'silver', check: g => g.player.kills >= 100},
 {id: 'level', name: 'Ya no sos el mismo', detail: 'Llegaste al nivel 10.', tier: 'silver', check: g => g.player.level >= 10},
 {id: 'truco', name: 'Truco y retruco', detail: 'Le ganaste un partido de truco a un alma de la Feria.', tier: 'bronze', check: g => (g.player.trucoWins || 0) > 0},
 {id: 'trucorev', name: 'Revancha del alma', detail: 'Le ganaste la revancha de truco a un alma.', tier: 'silver', check: g => (g.player.trucoRematchWins || 0) > 0},
 {id: 'dog', name: 'Lengüetazo', detail: 'Domesticaste al perro del plato vacío.', tier: 'bronze', check: pet('dog')},
 {id: 'bat', name: 'Sangre de mi sangre', detail: 'Domesticaste al murcielaguito de la Cueva Profunda.', tier: 'silver', check: pet('bat')},
 {id: 'golemsin', name: 'Piedra sobre piedra', detail: 'Domesticaste a un Golemsín.', tier: 'gold', check: pet('golem')},
 {id: 'snake', name: 'Leal y letal', detail: 'Domesticaste a la viborita de la Yarará.', tier: 'gold', check: pet('snake')},
 {id: 'gulp', name: 'De un bocado', detail: 'Tu serpiente se comió entero a un enemigo.', tier: 'silver', check: g => (g.player.petEats || 0) > 0},
 {id: 'kennel', name: 'Guardería llena', detail: 'Tenés a los cuatro compañeros.', tier: 'gold', check: g => Z.PET_ORDER.every(id => g.ownsPet(id))}
];
const BY_ID = Object.fromEntries(Z.MEDALS.map(m => [m.id, m]));
const baseCreate = Z.createPlayer;
Z.createPlayer = function (id) { return Object.assign(baseCreate(id), {medals: []}); };

const P = Z.Game.prototype;
Object.assign(P, {
 hasMedal(id) { return (this.player.medals || []).includes(id); },
 // Entrega una medalla. Con `quiet`, sin aviso (las que ya te correspondían al cargar la partida).
 awardMedal(id, quiet = false) {
  const p = this.player, m = BY_ID[id]; if (!m || this.hasMedal(id)) return false;
  p.medals = [...(p.medals || []), id];
  if (!quiet) { this.sound.play('legend'); this.effect(p.x, p.y - 34, 'medal', 2.2, {medal: id}); this.emit('toast', {message: '🏅 ¡Medalla nueva: ' + m.name + '! ' + m.detail}); this.emit('medal', {id}); this.emit('progress'); }
  return true;
 },
 checkMedals(quiet = false) { const got = []; for (const m of Z.MEDALS) if (m.check && !this.hasMedal(m.id) && m.check(this) && this.awardMedal(m.id, quiet)) got.push(m.id); return got; },
 updateMedals(dt) {
  const p = this.player;
  // Al cargar una partida, las medallas que ya te correspondían llegan todas juntas, con un solo aviso.
  if (this.medalPlayer !== p) { this.medalPlayer = p; this.medalClock = 0; const got = this.checkMedals(true); if (got.length) { this.emit('toast', {message: '🏅 Por lo que ya hiciste te llegaron ' + got.length + ' medalla' + (got.length > 1 ? 's' : '') + '. Miralas con L o desde el diario.'}); this.emit('progress'); } return; }
  this.medalClock = (this.medalClock || 0) + dt; if (this.medalClock < .5) return; this.medalClock = 0; this.checkMedals();
 }
});
Z.UPDATERS = Z.UPDATERS || []; Z.UPDATERS.push(function (dt) { this.updateMedals(dt); });
const baseCatch = P.catchFish, baseKnockout = P.knockout, baseRestore = P.restoreInventory;
P.catchFish = function () {
 const fish = baseCatch.call(this);
 if (this.raining && this.raining()) this.awardMedal('rainfish');
 if (fish === 'dorado') this.awardMedal('dorado');
 return fish;
};
P.knockout = function (source) { const r = baseKnockout.call(this, source); if (source === 'execute') this.awardMedal('executed'); return r; };
P.restoreInventory = function (p, source) {
 baseRestore.call(this, p, source);
 p.medals = Array.isArray(source.medals) ? [...new Set(source.medals.filter(id => Object.hasOwn(BY_ID, id)))] : [];
 this.medalPlayer = null;
};

/* ---------- Dibujo de las medallas ---------- */
const Px = Z.Pixel, R = (c, x, y, w, h, col) => Px.rect(c, x, y, w, h, col), POLY = (c, pts, col) => Px.poly(c, pts, col);
const disc = (c, x, y, r, col) => { const pts = []; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } POLY(c, pts, col); };
const TIERS = {bronze: ['#7a4a22', '#c07a3e', '#e8a868'], silver: ['#5d6670', '#aeb8c2', '#e8eef4'], gold: ['#8a6418', '#e2b23c', '#fff0a6']};
// Cada dibujo ocupa el círculo de adentro (radio 10, centrado en 0,0).
const ART = {
 bloodmoon(c) { disc(c, 0, 0, 10, '#2a0a14'); for (const [x, y] of [[-6, -6], [5, -7], [-8, 2], [7, 4]]) R(c, x, y, 1, 1, '#ffd6d6'); disc(c, 2, -2, 5, '#b3202a'); disc(c, 1, -3, 4, '#e0433f'); R(c, -1, -4, 2, 1, '#b3202a'); R(c, 3, -1, 2, 1, '#b3202a'); POLY(c, [[-10, 6], [-5, 1], [-1, 5], [3, 2], [10, 7], [10, 10], [-10, 10]], '#14060a'); R(c, -6, 3, 1, 2, '#ff3a3a'); R(c, -4, 3, 1, 2, '#ff3a3a'); },
 puddles(c) { disc(c, 0, 0, 10, '#6e8d4e'); POLY(c, [[-8, 3], [-3, 0], [4, 0], [9, 3], [5, 7], [-5, 7]], '#4d7884'); R(c, -4, 2, 5, 1, '#d6eef2'); for (const [x, y] of [[-6, -6], [-1, -9], [4, -5], [7, -8]]) { R(c, x, y, 1, 3, '#c8dcea'); } R(c, -9, 0, 2, 2, '#d6eef2'); R(c, 8, -1, 2, 2, '#d6eef2'); },
 rainfish(c) { disc(c, 0, 0, 10, '#2f4a5c'); for (const [x, y] of [[-7, -8], [-2, -9], [3, -8], [7, -7]]) R(c, x, y, 1, 3, '#c8dcea'); POLY(c, [[-7, 2], [-2, -2], [4, -1], [7, 2], [4, 5], [-2, 5]], '#9fb4c0'); POLY(c, [[7, 2], [10, -1], [10, 5]], '#9fb4c0'); R(c, -4, 1, 1, 1, '#1a1512'); R(c, -1, 3, 6, 1, '#6d8794'); },
 dorado(c) { disc(c, 0, 0, 10, '#2f6a7a'); POLY(c, [[-8, 0], [-3, -5], [4, -4], [7, 0], [4, 4], [-3, 5]], '#f2b03a'); POLY(c, [[7, 0], [10, -4], [10, 4]], '#e08a1e'); R(c, -5, -1, 2, 2, '#1a1512'); R(c, -2, -3, 6, 1, '#ffe08a'); for (let k = -1; k < 5; k += 2) R(c, k, 0, 1, 3, '#c9761c'); R(c, -9, -8, 1, 3, '#fff6c0'); R(c, -10, -7, 3, 1, '#fff6c0'); },
 capo(c) { disc(c, 0, 0, 10, '#3a3040'); R(c, -9, -2, 7, 5, '#111014'); R(c, 2, -2, 7, 5, '#111014'); R(c, -2, -1, 4, 1, '#111014'); R(c, -8, -1, 2, 1, '#5a5a6a'); POLY(c, [[3, -2], [6, 3], [5, 3], [2, -1]], '#cfd6de'); R(c, 6, -1, 1, 1, '#cfd6de'); R(c, -3, 6, 6, 3, '#c9a24c'); R(c, -2, 5, 4, 1, '#ffe08a'); R(c, -1, 6, 2, 2, '#8a2030'); },
 yarara(c) { disc(c, 0, 0, 10, '#2c3a2a'); POLY(c, [[-6, -6], [6, -6], [8, 0], [0, 4], [-8, 0]], '#7a5ca0'); R(c, -4, -4, 2, 2, '#f1d36b'); R(c, 2, -4, 2, 2, '#f1d36b'); POLY(c, [[-3, 2], [-1, 2], [-2, 8]], '#f4efdc'); POLY(c, [[1, 2], [3, 2], [2.5, 5]], '#f4efdc'); R(c, 1, 6, 2, 2, '#f4efdc'); R(c, 3, 8, 1, 1, '#f4efdc'); },
 vampire(c) { disc(c, 0, 0, 10, '#3a1020'); POLY(c, [[-2, -9], [2, -9], [1, 8], [-1, 8]], '#9a6a3a'); POLY(c, [[-1, 8], [1, 8], [0, 10]], '#c9a27e'); R(c, -2, -9, 4, 1, '#c49a5a'); POLY(c, [[-9, -2], [-4, -5], [-2, -2], [-4, 1]], '#4a3e58'); POLY(c, [[9, -2], [4, -5], [2, -2], [4, 1]], '#4a3e58'); R(c, -6, 3, 1, 2, '#c43a4a'); R(c, 6, 4, 1, 2, '#c43a4a'); },
 golem(c) { disc(c, 0, 0, 10, '#2e2523'); R(c, -7, -6, 6, 9, '#8a8f96'); R(c, 1, -7, 6, 10, '#8a8f96'); R(c, -6, -5, 4, 1, '#b8bcc2'); R(c, 2, -6, 4, 1, '#b8bcc2'); R(c, -5, -2, 2, 2, '#ff5a3c'); R(c, 3, -2, 2, 1, '#5a3a2a'); POLY(c, [[-1, -8], [1, -8], [0, 0], [2, 4], [-1, 4]], '#2e2523'); for (const [x, y, s] of [[-8, 6, 3], [-3, 7, 2], [3, 6, 3], [7, 5, 2]]) R(c, x, y, s, s, '#6a6e74'); R(c, -2, -10, 4, 2, '#c9a23c'); },
 cerbero(c) { disc(c, 0, 0, 10, '#2a2228'); for (const a of [-.6, 0, .6]) { const x = Math.sin(a) * 6, y = -Math.cos(a) * 2; Px.rrect(c, x, y, a, -1, -8, 3, 13, '#e9e3ea'); R(c, Math.round(x - 2 + Math.sin(a) * 6), Math.round(y - 8), 2, 2, '#e9e3ea'); } R(c, -2, 6, 4, 2, '#e9e3ea'); R(c, -3, 7, 2, 2, '#e9e3ea'); R(c, 1, 7, 2, 2, '#e9e3ea'); R(c, -6, -7, 1, 1, '#c43a4a'); R(c, 5, -7, 1, 1, '#c43a4a'); },
 archmage(c) { disc(c, 0, 0, 10, '#1e1a29'); POLY(c, [[-9, 5], [7, 6], [-1, -8]], '#4b3fa0'); POLY(c, [[-1, -8], [2, -7], [-1, -3]], '#4b3fa0'); R(c, -10, 5, 18, 3, '#2f2766'); R(c, -2, -2, 2, 2, '#f2c94c'); R(c, 3, 1, 2, 2, '#f2c94c'); R(c, 5, -6, 1, 1, '#e6d6ff'); R(c, -7, -5, 1, 1, '#e6d6ff'); },
 zak(c) { disc(c, 0, 0, 10, '#15131b'); R(c, -6, -2, 12, 9, '#3a3048'); R(c, -5, -1, 10, 7, '#6d4ba0'); R(c, -7, 6, 14, 2, '#2a2236'); for (const x of [-6, -2, 2, 6]) POLY(c, [[x - 2, -2], [x, -8], [x + 2, -2]], '#e2b23c'); R(c, -1, 1, 2, 2, '#a77bff'); for (const [x, y] of [[-9, -4], [8, -5], [-8, 3], [8, 2]]) R(c, x, y, 1, 2, '#c99bff'); },
 fury(c) { disc(c, 0, 0, 10, '#2a0a10'); for (const x of [-6, -2, 2, 6]) POLY(c, [[x - 2, 0], [x, -7], [x + 2, 0]], '#e2b23c'); R(c, -7, 0, 14, 5, '#e2b23c'); R(c, -6, 1, 12, 1, '#fff0a6'); POLY(c, [[-1, -8], [1, -8], [-1, -1], [2, 1], [0, 6], [-2, 1]], '#2a0a10'); R(c, -5, 2, 2, 2, '#c43a4a'); R(c, 4, 2, 2, 2, '#c43a4a'); for (const [x, y] of [[-8, 6], [-4, 8], [5, 7], [8, 5]]) R(c, x, y, 2, 1, '#ff5a48'); },
 executed(c) { disc(c, 0, 0, 10, '#1a1424'); disc(c, 0, -1, 6, '#e9e3ea'); R(c, -4, 4, 8, 3, '#e9e3ea'); R(c, -3, -2, 2, 3, '#1a1424'); R(c, 1, -2, 2, 3, '#1a1424'); R(c, -1, 2, 2, 1, '#1a1424'); for (const x of [-3, -1, 1, 3]) R(c, x, 5, 1, 2, '#1a1424'); POLY(c, [[-8, -10], [9, 7], [7, 9], [-10, -8]], '#a77bff'); },
 mimic(c) { disc(c, 0, 0, 10, '#2a1a0a'); R(c, -8, 0, 16, 7, '#8a5a2a'); R(c, -8, 2, 16, 1, '#c9a24c'); R(c, -8, -7, 16, 5, '#8a5a2a'); R(c, -8, -3, 16, 1, '#c9a24c'); R(c, -7, -2, 14, 2, '#3a0a0a'); for (let x = -7; x < 7; x += 3) { R(c, x, -2, 2, 1, '#efe6cf'); R(c, x + 1, -1, 2, 1, '#efe6cf'); } R(c, -5, -6, 2, 1, '#ff5a3a'); R(c, 3, -6, 2, 1, '#ff5a3a'); },
 elemental(c) { disc(c, 0, 0, 10, '#1d1a2e'); Px.rrect(c, 0, 0, -Math.PI / 4, -2, -11, 4, 15, '#e6d6ff'); Px.rrect(c, 0, 0, -Math.PI / 4, -1, -11, 1, 15, '#ffffff'); Px.rrect(c, 0, 0, -Math.PI / 4, -5, 4, 10, 2, '#e2b23c'); Px.rrect(c, 0, 0, -Math.PI / 4, -1, 6, 2, 4, '#6b4a2a'); for (const [x, y, col] of [[-6, -5, '#ff7a2a'], [5, -6, '#7fe6f2'], [-5, 5, '#9dd16a'], [6, 4, '#c9a6ff']]) R(c, x, y, 2, 2, col); },
 kills(c) { disc(c, 0, 0, 10, '#2a2f2a'); for (const [x, y] of [[-6, 2], [0, 2], [6, 2], [-3, -4], [3, -4]]) { disc(c, x, y, 3, '#e9e3ea'); R(c, x - 2, y - 1, 1, 1, '#2a2f2a'); R(c, x + 1, y - 1, 1, 1, '#2a2f2a'); } R(c, -6, 6, 12, 2, '#c9a24c'); },
 level(c) { disc(c, 0, 0, 10, '#2f3a52'); POLY(c, [[0, -9], [2.5, -3], [9, -3], [4, 1], [6, 8], [0, 4], [-6, 8], [-4, 1], [-9, -3], [-2.5, -3]], '#f2c94c'); POLY(c, [[0, -6], [1.5, -2], [-1.5, -2]], '#fff0a6'); },
 truco(c) { disc(c, 0, 0, 10, '#2a3a2a'); Px.rrect(c, 0, 0, -.35, -9, -6, 8, 12, '#efe6cf'); Px.rrect(c, 0, 0, .3, 1, -7, 8, 12, '#efe6cf'); disc(c, -5, 0, 2, '#e2b23c'); Px.rrect(c, 4, 0, .3, -1, -4, 2, 8, '#6d8794'); Px.rrect(c, 4, 0, .3, -2, 2, 4, 1, '#e2b23c'); R(c, -7, -5, 1, 2, '#b5383f'); },
 trucorev(c) { disc(c, 0, 0, 10, '#2a1f3a'); POLY(c, [[-6, -8], [6, -8], [7, 6], [3, 3], [0, 7], [-3, 3], [-7, 6]], '#e6d6ff'); R(c, -3, -5, 2, 2, '#2a1f3a'); R(c, 2, -5, 2, 2, '#2a1f3a'); Px.rrect(c, 0, 0, -.2, -2, -1, 6, 8, '#efe6cf'); R(c, 0, 1, 2, 2, '#b5383f'); R(c, 1, 3, 1, 2, '#b5383f'); },
 dog(c) { disc(c, 0, 0, 10, '#4a6a3a'); disc(c, 0, 2, 4, '#b07a45'); for (const [x, y] of [[-5, -3], [-2, -6], [2, -6], [5, -3]]) disc(c, x, y, 2, '#b07a45'); R(c, 4, 4, 2, 4, '#d9708a'); R(c, 4, 7, 2, 1, '#b5506a'); R(c, -8, -8, 2, 2, '#e9ac9a'); R(c, 7, -9, 2, 2, '#e9ac9a'); },
 bat(c) { disc(c, 0, 0, 10, '#22252b'); POLY(c, [[-2, -2], [-9, -6], [-7, -1], [-9, 2], [-2, 2]], '#4a3e58'); POLY(c, [[2, -2], [9, -6], [7, -1], [9, 2], [2, 2]], '#4a3e58'); R(c, -3, -3, 6, 6, '#5b4d6b'); R(c, -2, -5, 1, 2, '#5b4d6b'); R(c, 1, -5, 1, 2, '#5b4d6b'); R(c, -2, -2, 1, 1, '#f1d36b'); R(c, 1, -2, 1, 1, '#f1d36b'); disc(c, 0, 7, 2, '#c43a4a'); R(c, -1, 4, 2, 2, '#c43a4a'); },
 golemsin(c) { disc(c, 0, 0, 10, '#2e2523'); R(c, -5, -3, 10, 8, '#8a8f96'); R(c, -4, -2, 8, 2, '#b8bcc2'); R(c, -4, -8, 8, 6, '#8a8f96'); R(c, -3, -6, 2, 2, '#ffb347'); R(c, 1, -6, 2, 2, '#ffb347'); R(c, -7, -2, 2, 5, '#6a6e74'); R(c, 5, -2, 2, 5, '#6a6e74'); R(c, -4, 5, 3, 3, '#6a6e74'); R(c, 1, 5, 3, 3, '#6a6e74'); disc(c, 7, 6, 2, '#e9ac9a'); },
 snake(c) { disc(c, 0, 0, 10, '#2a3a28'); for (let k = 0; k < 9; k++) { const a = k * .7, r = 7 - k * .6; disc(c, Math.cos(a) * r, Math.sin(a) * r * .8 + 1, 2.2, k % 2 ? '#7a5ca0' : '#9d80c6'); } POLY(c, [[-2, -3], [3, -4], [5, -2], [3, 0], [-2, -1]], '#8a6bb0'); R(c, 1, -3, 1, 1, '#f1d36b'); R(c, 5, -2, 2, 1, '#d65f6b'); R(c, -1, 6, 2, 2, '#f1d36b'); },
 gulp(c) { disc(c, 0, 0, 10, '#2a3a28'); POLY(c, [[-9, 2], [-4, -4], [4, -4], [9, 2], [4, 6], [-4, 6]], '#7a5ca0'); disc(c, 1, 1, 4, '#9d80c6'); R(c, -6, -1, 1, 1, '#f1d36b'); R(c, -9, 1, 3, 1, '#3d1830'); R(c, -1, 0, 2, 1, '#6a4e8f'); R(c, 2, 2, 2, 1, '#6a4e8f'); R(c, 6, -7, 3, 1, '#efe6cf'); R(c, 7, -9, 1, 1, '#efe6cf'); },
 kennel(c) { disc(c, 0, 0, 10, '#4a6a3a'); POLY(c, [[-8, -1], [0, -8], [8, -1]], '#93834f'); R(c, -6, -1, 12, 8, '#d6c298'); R(c, -2, 2, 4, 5, '#795b3e'); for (const [x, y, col] of [[-8, 7, '#b07a45'], [-4, 8, '#4a3e58'], [4, 8, '#8a8f96'], [8, 7, '#7a5ca0']]) disc(c, x, y, 1.6, col); R(c, -1, -5, 2, 2, '#e9ac9a'); }
};
// Dibuja una medalla de radio 14 centrada en (x,y). Bloqueada: gris, con un signo de pregunta.
Z.drawMedal = function (c, id, x, y, scale = 1, locked = false) {
 const m = BY_ID[id]; if (!m) return; const [dark, mid, light] = locked ? ['#2a2a30', '#4a4a52', '#6a6a74'] : TIERS[m.tier];
 const before = Px.scale; c.save(); c.translate(Math.round(x), Math.round(y)); Px.scale = before * scale;
 POLY(c, [[-7, -20], [-2, -20], [-1, -10], [-6, -10]], locked ? '#3a3a42' : '#b5383f'); POLY(c, [[2, -20], [7, -20], [6, -10], [1, -10]], locked ? '#33333a' : '#2f5fa8');
 disc(c, 0, 0, 14, dark); disc(c, 0, 0, 13, mid); disc(c, -1, -1, 12, light); disc(c, 0, 0, 11, dark);
 if (locked) { disc(c, 0, 0, 10, '#1f1f24'); R(c, -3, -6, 6, 2, '#6a6a74'); R(c, 2, -5, 2, 4, '#6a6a74'); R(c, -1, -2, 3, 2, '#6a6a74'); R(c, -1, 1, 2, 2, '#6a6a74'); R(c, -1, 5, 2, 2, '#6a6a74'); }
 else { c.save(); ART[id](c); c.restore(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; R(c, Math.round(Math.cos(a) * 12.5), Math.round(Math.sin(a) * 12.5), 1, 1, light); } }
 Px.scale = before; c.restore();
};
// Medalla en un canvas suelto (el medallero).
Z.drawMedalCanvas = function (canvas, id, locked) { const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height); const s = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / 44)); Z.drawMedal(c, id, canvas.width / 2, canvas.height / 2 + 3 * s, s, locked); };
// La medalla nueva sube sobre tu cabeza y brilla.
const baseEffect = Z.drawExtraEffect;
Z.drawExtraEffect = function (c, e, time, progress) {
 if (e.type === 'medal') {
  const rise = Math.min(1, progress * 3), y = e.y - rise * 18, fade = progress > .8 ? (1 - progress) / .2 : 1;
  c.globalAlpha = fade; if (Px.glow) Px.glow(c, e.x, y, 26, '#fff0a6', .5 * fade);
  Z.drawMedal(c, e.medal, e.x, y, 1, false);
  const m = BY_ID[e.medal]; if (m) Px.text(c, m.name.toUpperCase(), e.x, y + 22, '#fff0a6', 7, 'center', '#1f1712', true);
  return true;
 }
 return baseEffect ? baseEffect(c, e, time, progress) : false;
};
})();
