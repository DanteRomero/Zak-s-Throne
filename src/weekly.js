/* Desafío semanal: el mismo desafío para todos los amigos durante la semana (de lunes a domingo).
   Es difícil a propósito: lleva más de un día. Al cumplirlo cobrás guita y experiencia, y quien lo cumple primero
   (según el ranking online) cobra un 50% más. Cada partida lleva su propio progreso. */
(function () {
'use strict';
const Z = window.Zak;
const finite = n => Number.isFinite(Number(n)) ? Number(n) : 0;
const isBoss = e => !!(Z.ENEMY_TYPES[e.type] && Z.ENEMY_TYPES[e.type].boss);
const W = Z.WEEKLY = {coins: 2500, xp: 4000, first: 1.5, retries: 5, retryEvery: 30};
// `on`: qué cuenta. `types` y `biomes` limitan qué enemigos valen.
Z.WEEKLY_LIST = [
 {id: 'hunter', name: 'Cazador de la semana', detail: 'Derrotá 500 enemigos.', goal: 500, on: 'kill'},
 {id: 'bosses', name: 'Matajefes', detail: 'Derrotá 15 jefes (pueden repetirse).', goal: 15, on: 'boss'},
 {id: 'fisher', name: 'Pescador de ley', detail: 'Pescá 60 peces.', goal: 60, on: 'fish'},
 {id: 'miner', name: 'Manos a la obra', detail: 'Juntá 400 materiales talando y picando.', goal: 400, on: 'gather'},
 {id: 'truco', name: 'Rey de la Feria', detail: 'Ganale 10 partidos de truco a las almas de la Feria.', goal: 10, on: 'truco'},
 {id: 'graves', name: 'Descanso eterno', detail: 'Derrotá 150 esqueletos (con escudo o arqueros).', goal: 150, on: 'kill', types: ['skeleton', 'archer']},
 {id: 'deep', name: 'Bajo tierra', detail: 'Derrotá 200 enemigos en la Cueva Profunda y Las Entrañas.', goal: 200, on: 'kill', biomes: ['cave2', 'cave3']},
 {id: 'realm', name: 'Turista del vacío', detail: 'Derrotá 150 enemigos en la dimensión de Zak.', goal: 150, on: 'kill', realm: true}
];
// Semana ISO del calendario local: «2026-W47». Cambia los lunes a las 00:00.
Z.weekId = function (date = new Date()) {
 const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()), day = (d.getDay() + 6) % 7;
 d.setDate(d.getDate() - day + 3);
 const first = new Date(d.getFullYear(), 0, 4), week = 1 + Math.round(((d - first) / 864e5 - 3 + (first.getDay() + 6) % 7) / 7);
 return d.getFullYear() + '-W' + String(week).padStart(2, '0');
};
// Cuánto falta para el lunes que viene.
Z.weekLeft = function (date = new Date()) {
 const next = new Date(date.getFullYear(), date.getMonth(), date.getDate()); next.setDate(next.getDate() + (7 - (next.getDay() + 6) % 7));
 return Math.max(0, next - date);
};
Z.weeklyFor = function (week) { let h = 0; for (const ch of String(week)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return Z.WEEKLY_LIST[h % Z.WEEKLY_LIST.length]; };
Z.WEEK_PATTERN = /^\d{4}-W\d{2}$/;

const P = Z.Game.prototype;
Object.assign(P, {
 // El desafío de esta semana y tu progreso. Si cambió la semana, el progreso arranca de cero.
 weekly(now = new Date()) {
  const p = this.player, week = Z.weekId(now);
  if (!p.weekly || p.weekly.week !== week) {
   // Un premio que quedó sin cobrar de la semana pasada se cobra igual (sin el extra del primero).
   if (p.weekly && p.weekly.done && !p.weekly.paid) this.payWeekly(false, p.weekly);
   p.weekly = {week, id: Z.weeklyFor(week).id, count: 0, done: false, at: 0, paid: false, first: false};
  }
  return p.weekly;
 },
 weeklyChallenge() { return Z.WEEKLY_LIST.find(c => c.id === this.weekly().id) || Z.weeklyFor(this.weekly().week); },
 weeklyProgress(on, amount = 1, e = null) {
  const w = this.weekly(), c = this.weeklyChallenge(); if (w.done || c.on !== on || amount <= 0) return;
  if (e && c.types && !c.types.includes(e.type)) return;
  if (e && c.biomes && !c.biomes.includes(e.biome)) return;
  if (e && c.realm && !Z.isZakDimension(e.biome)) return;
  const before = w.count; w.count = Math.min(c.goal, before + amount);
  // Avisos al 25, 50 y 75%.
  for (const mark of [.25, .5, .75]) if (before < c.goal * mark && w.count >= c.goal * mark) this.emit('toast', {message: '📅 Desafío semanal «' + c.name + '»: ' + w.count + ' de ' + c.goal + '.'});
  if (w.count >= c.goal) { w.done = true; w.at = Date.now(); this.sound.play('legend'); this.emit('toast', {message: '📅 ¡Cumpliste el desafío semanal «' + c.name + '»! Fijándome si fuiste el primero...'}); this.emit('progress'); this.claimWeekly(); }
 },
 // Cobra el premio: pregunta al ranking online si alguien lo cumplió antes esta semana.
 async claimWeekly() {
  const p = this.player, w = p.weekly; if (!w || !w.done || w.paid || this.weeklyBusy) return;
  this.weeklyBusy = true; let first = null, failed = false;
  try {
   if (Z.Ranking && Z.Ranking.online()) { await Z.Ranking.submit(this); first = await Z.Ranking.weeklyFirst(w.week, p.runId); }
  } catch (_) { failed = true; } finally { this.weeklyBusy = false; }
  if (this.player !== p || w.paid) return;
  if (failed) { w.tries = finite(w.tries) + 1; if (w.tries < W.retries) { this.weeklyRetry = W.retryEvery; return; } first = null; }
  this.payWeekly(first === true, w);
 },
 payWeekly(first, w = this.player.weekly) {
  const p = this.player; if (!w || w.paid) return;
  const k = first ? W.first : 1, coins = Math.round(W.coins * k), xp = Math.round(W.xp * k);
  w.paid = true; w.first = !!first; p.coins += coins;
  const levels = Z.grantXp(p, xp, this.context()); if (levels && this.onLevel) this.onLevel(levels);
  if (this.awardMedal) { this.awardMedal('weekly'); if (first) this.awardMedal('weeklyfirst'); }
  this.emit('toast', {message: first ? '🥇 ¡Fuiste el primero en cumplir el desafío de la semana! Cobrás x1,5: ◉ ' + coins + ' y ' + xp + ' de experiencia.' : '📅 Premio del desafío semanal: ◉ ' + coins + ' y ' + xp + ' de experiencia.'});
  this.emit('progress');
 },
 updateWeekly(dt) {
  const w = this.player.weekly; if (!w || !w.done || w.paid) return;
  if (this.weeklyRetry > 0) { this.weeklyRetry -= dt; if (this.weeklyRetry <= 0) this.claimWeekly(); }
  else if (!this.weeklyBusy && this.weeklyRetry === undefined) { this.weeklyRetry = 0; this.claimWeekly(); }
 }
});
Z.UPDATERS = Z.UPDATERS || []; Z.UPDATERS.push(function (dt) { this.updateWeekly(dt); });

// Qué cuenta para el desafío.
const baseKill = P.onKill, baseCatch = P.catchFish, baseGather = P.updateGather, baseSettle = P.trucoSettle, baseRestore = P.restoreInventory, baseNew = P.newGame;
P.onKill = function (e) {
 const r = baseKill.call(this, e);
 if (!e.illusion) { this.weeklyProgress('kill', 1, e); if (isBoss(e) && !e.summoned) this.weeklyProgress('boss', 1, e); }
 return r;
};
P.catchFish = function () { const fish = baseCatch.call(this); if (fish) this.weeklyProgress('fish', 1); return fish; };
P.updateGather = function (dt) {
 const m = this.player.materials || {}, sum = () => Object.values(m).reduce((a, b) => a + finite(b), 0), before = sum();
 const r = baseGather.call(this, dt); const gained = sum() - before; if (gained > 0) this.weeklyProgress('gather', gained); return r;
};
if (baseSettle) P.trucoSettle = function () {
 const t = this.truco, was = t && t.settled; const r = baseSettle.call(this);
 if (t && !was && t.settled && t.match.winner === 'player') this.weeklyProgress('truco', 1);
 return r;
};
P.restoreInventory = function (p, source) {
 baseRestore.call(this, p, source);
 const w = source.weekly;
 p.weekly = w && typeof w === 'object' && Z.WEEK_PATTERN.test(String(w.week)) && Z.WEEKLY_LIST.some(c => c.id === w.id)
  ? {week: String(w.week), id: w.id, count: Math.floor(Math.max(0, Math.min(1e6, finite(w.count)))), done: w.done === true, at: Math.max(0, finite(w.at)), paid: w.paid === true, first: w.first === true, tries: 0}
  : null;
 this.weeklyBusy = false; this.weeklyRetry = undefined;
};
P.newGame = function (id) { this.weeklyBusy = false; this.weeklyRetry = undefined; return baseNew.call(this, id); };
})();
